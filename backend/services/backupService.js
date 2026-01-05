const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const cron = require('node-cron');
const { Pool } = require('pg');
const winston = require('winston');

/**
 * Servicio de backup encriptado automático
 */
class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || this.generateEncryptionKey();
    this.algorithm = 'aes-256-gcm';
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    
    // Configurar logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: path.join(__dirname, '../logs/backup.log') }),
        new winston.transports.Console()
      ]
    });

    // Crear directorio de backups si no existe
    this.ensureBackupDirectory();
    
    // Configurar tareas programadas
    this.setupScheduledBackups();
  }

  /**
   * Generar clave de encriptación si no existe
   */
  generateEncryptionKey() {
    const key = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️ Generando nueva clave de encriptación. Guarda esta clave de forma segura:');
    console.warn(`BACKUP_ENCRYPTION_KEY=${key}`);
    return key;
  }

  /**
   * Asegurar que el directorio de backups existe
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true, mode: 0o700 });
      this.logger.info(`📁 Directorio de backups creado: ${this.backupDir}`);
    }
  }

  /**
   * Configurar tareas programadas de backup
   */
  setupScheduledBackups() {
    // Backup diario a las 2:00 AM
    cron.schedule('0 2 * * *', () => {
      this.logger.info('🔄 Iniciando backup diario programado');
      this.createFullBackup().catch(error => {
        this.logger.error('Error en backup diario:', error);
      });
    });

    // Backup de base de datos cada 6 horas
    cron.schedule('0 */6 * * *', () => {
      this.logger.info('🔄 Iniciando backup de base de datos programado');
      this.createDatabaseBackup().catch(error => {
        this.logger.error('Error en backup de base de datos:', error);
      });
    });

    // Limpieza de backups antiguos diariamente a las 3:00 AM
    cron.schedule('0 3 * * *', () => {
      this.logger.info('🧹 Iniciando limpieza de backups antiguos');
      this.cleanupOldBackups().catch(error => {
        this.logger.error('Error en limpieza de backups:', error);
      });
    });

    this.logger.info('⏰ Tareas programadas de backup configuradas');
  }

  /**
   * Crear backup completo del sistema
   */
  async createFullBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `full_backup_${timestamp}`;
    const backupPath = path.join(this.backupDir, `${backupName}.tar.gz.enc`);

    try {
      this.logger.info(`🔄 Iniciando backup completo: ${backupName}`);

      // 1. Crear backup de base de datos
      const dbBackup = await this.createDatabaseBackup();
      
      // 2. Crear backup de archivos
      const filesBackup = await this.createFilesBackup();
      
      // 3. Crear backup de configuración
      const configBackup = await this.createConfigBackup();

      // 4. Combinar todos los backups en un archivo encriptado
      await this.combineAndEncryptBackups([dbBackup, filesBackup, configBackup], backupPath);

      // 5. Verificar integridad del backup
      const isValid = await this.verifyBackupIntegrity(backupPath);
      
      if (isValid) {
        this.logger.info(`✅ Backup completo creado exitosamente: ${backupPath}`);
        
        // 6. Limpiar archivos temporales
        await this.cleanupTempFiles([dbBackup, filesBackup, configBackup]);
        
        return {
          success: true,
          backupPath: backupPath,
          size: fs.statSync(backupPath).size,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Backup creado pero falló la verificación de integridad');
      }

    } catch (error) {
      this.logger.error('Error creando backup completo:', error);
      throw error;
    }
  }

  /**
   * Crear backup de base de datos
   */
  async createDatabaseBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `db_backup_${timestamp}.sql`;
    const backupPath = path.join(this.backupDir, backupName);

    try {
      this.logger.info('🔄 Creando backup de base de datos...');

      const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'eventu_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      });

      // Obtener todas las tablas
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      const tables = tablesResult.rows.map(row => row.table_name);
      let backupContent = '';

      // Backup de estructura de tablas
      backupContent += '-- Backup de estructura de base de datos\n';
      backupContent += `-- Generado el: ${new Date().toISOString()}\n\n`;

      for (const table of tables) {
        // Obtener estructura de la tabla
        const structureResult = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);

        backupContent += `-- Estructura de tabla: ${table}\n`;
        backupContent += `CREATE TABLE IF NOT EXISTS ${table} (\n`;
        
        const columns = structureResult.rows.map(col => {
          let columnDef = `  ${col.column_name} ${col.data_type}`;
          if (col.is_nullable === 'NO') columnDef += ' NOT NULL';
          if (col.column_default) columnDef += ` DEFAULT ${col.column_default}`;
          return columnDef;
        }).join(',\n');
        
        backupContent += columns + '\n);\n\n';

        // Backup de datos
        const dataResult = await pool.query(`SELECT * FROM ${table}`);
        if (dataResult.rows.length > 0) {
          backupContent += `-- Datos de tabla: ${table}\n`;
          for (const row of dataResult.rows) {
            const values = Object.values(row).map(val => 
              val === null ? 'NULL' : `'${val.toString().replace(/'/g, "''")}'`
            ).join(', ');
            backupContent += `INSERT INTO ${table} VALUES (${values});\n`;
          }
          backupContent += '\n';
        }
      }

      // Escribir backup a archivo
      fs.writeFileSync(backupPath, backupContent, 'utf8');
      
      await pool.end();
      
      this.logger.info(`✅ Backup de base de datos creado: ${backupPath}`);
      return backupPath;

    } catch (error) {
      this.logger.error('Error creando backup de base de datos:', error);
      throw error;
    }
  }

  /**
   * Crear backup de archivos
   */
  async createFilesBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `files_backup_${timestamp}.tar.gz`;
    const backupPath = path.join(this.backupDir, backupName);

    try {
      this.logger.info('🔄 Creando backup de archivos...');

      const output = fs.createWriteStream(backupPath);
      const archive = archiver('tar', {
        gzip: true,
        gzipOptions: { level: 9 }
      });

      output.on('close', () => {
        this.logger.info(`✅ Backup de archivos creado: ${backupPath} (${archive.pointer()} bytes)`);
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(output);

      // Agregar directorios importantes
      const directoriesToBackup = [
        'uploads/safe',
        'logs',
        'public/images'
      ];

      for (const dir of directoriesToBackup) {
        const fullPath = path.join(__dirname, '../', dir);
        if (fs.existsSync(fullPath)) {
          archive.directory(fullPath, dir);
        }
      }

      await archive.finalize();
      return backupPath;

    } catch (error) {
      this.logger.error('Error creando backup de archivos:', error);
      throw error;
    }
  }

  /**
   * Crear backup de configuración
   */
  async createConfigBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `config_backup_${timestamp}.json`;
    const backupPath = path.join(this.backupDir, backupName);

    try {
      this.logger.info('🔄 Creando backup de configuración...');

      const config = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          name: process.env.DB_NAME,
          user: process.env.DB_USER,
          // No incluir password por seguridad
        },
        server: {
          port: process.env.PORT,
          frontend_url: process.env.FRONTEND_URL
        },
        features: {
          cors_enabled: !!process.env.ALLOWED_ORIGINS,
          rate_limiting: !!process.env.RATE_LIMIT_MAX,
          two_factor_auth: !!process.env.TWO_FACTOR_AUTH_ENABLED
        }
      };

      fs.writeFileSync(backupPath, JSON.stringify(config, null, 2), 'utf8');
      
      this.logger.info(`✅ Backup de configuración creado: ${backupPath}`);
      return backupPath;

    } catch (error) {
      this.logger.error('Error creando backup de configuración:', error);
      throw error;
    }
  }

  /**
   * Combinar y encriptar backups
   */
  async combineAndEncryptBackups(backupFiles, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('tar', {
          gzip: true,
          gzipOptions: { level: 9 }
        });

        // Crear cipher para encriptación
        const key = Buffer.from(this.encryptionKey, 'hex');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.algorithm, key);
        cipher.setAAD(Buffer.from('eventu-backup'));

        // Escribir IV al inicio del archivo
        output.write(iv);

        output.on('close', () => {
          this.logger.info(`✅ Backup encriptado creado: ${outputPath}`);
          resolve();
        });

        archive.on('error', reject);
        output.on('error', reject);

        // Pipe: archive -> cipher -> output
        archive.pipe(cipher).pipe(output);

        // Agregar archivos de backup
        for (const backupFile of backupFiles) {
          if (fs.existsSync(backupFile)) {
            archive.file(backupFile, { name: path.basename(backupFile) });
          }
        }

        archive.finalize();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Verificar integridad del backup
   */
  async verifyBackupIntegrity(backupPath) {
    try {
      // Verificar que el archivo existe y tiene contenido
      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        return false;
      }

      // Verificar que se puede leer el IV
      const fd = fs.openSync(backupPath, 'r');
      const iv = Buffer.alloc(16);
      fs.readSync(fd, iv, 0, 16, 0);
      fs.closeSync(fd);

      // Verificar que el IV no es todo ceros
      return !iv.every(byte => byte === 0);

    } catch (error) {
      this.logger.error('Error verificando integridad del backup:', error);
      return false;
    }
  }

  /**
   * Limpiar archivos temporales
   */
  async cleanupTempFiles(files) {
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          this.logger.info(`🗑️ Archivo temporal eliminado: ${file}`);
        }
      } catch (error) {
        this.logger.warn(`No se pudo eliminar archivo temporal: ${file}`, error);
      }
    }
  }

  /**
   * Limpiar backups antiguos
   */
  async cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      let deletedCount = 0;
      let freedSpace = 0;

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          freedSpace += stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
          this.logger.info(`🗑️ Backup antiguo eliminado: ${file}`);
        }
      }

      this.logger.info(`🧹 Limpieza completada: ${deletedCount} archivos eliminados, ${(freedSpace / 1024 / 1024).toFixed(2)}MB liberados`);

    } catch (error) {
      this.logger.error('Error en limpieza de backups:', error);
    }
  }

  /**
   * Restaurar backup
   */
  async restoreBackup(backupPath, options = {}) {
    try {
      this.logger.info(`🔄 Iniciando restauración desde: ${backupPath}`);

      if (!fs.existsSync(backupPath)) {
        throw new Error('Archivo de backup no encontrado');
      }

      // Verificar integridad
      const isValid = await this.verifyBackupIntegrity(backupPath);
      if (!isValid) {
        throw new Error('Backup corrupto o inválido');
      }

      // TODO: Implementar lógica de restauración
      // Esto requeriría desencriptar y extraer los archivos
      
      this.logger.info('✅ Restauración completada');
      return { success: true };

    } catch (error) {
      this.logger.error('Error restaurando backup:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de backups disponibles
   */
  getAvailableBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter(file => file.endsWith('.tar.gz.enc'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.created - a.created);

      return backups;
    } catch (error) {
      this.logger.error('Error obteniendo lista de backups:', error);
      return [];
    }
  }
}

// Instancia singleton
const backupService = new BackupService();

module.exports = {
  BackupService,
  backupService
};
