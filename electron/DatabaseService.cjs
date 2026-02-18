const pg = require('pg');
const mysql2 = require('mysql2/promise');
const sql = require('mssql');
const odbc = require('odbc');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const { Pool: PgPool } = pg;

class DatabaseService {
  constructor() {
    this.connections = new Map(); // Almacenar conexiones activas por ID
    this.savedConnections = []; // Conexiones guardadas
    this.connectionsFilePath = this.getConnectionsFilePath();
    this.loadSavedConnections();
  }

  // Obtener ruta del archivo de conexiones guardadas
  getConnectionsFilePath() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'database-connections.json');
  }

  // Cargar conexiones guardadas desde archivo
  loadSavedConnections() {
    try {
      if (fs.existsSync(this.connectionsFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.connectionsFilePath, 'utf8'));
        this.savedConnections = data.connections || [];
      } else {
        this.savedConnections = [];
      }
    } catch (error) {
      console.error('Error cargando conexiones guardadas:', error);
      this.savedConnections = [];
    }
  }

  // Guardar conexiones en archivo
  saveConnections() {
    try {
      const data = {
        connections: this.savedConnections
      };
      fs.writeFileSync(this.connectionsFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error guardando conexiones:', error);
      throw error;
    }
  }

  // Obtener todas las conexiones guardadas
  getSavedConnections() {
    return [...this.savedConnections];
  }

  // Guardar una nueva conexión
  saveConnection(connectionData) {
    const connection = {
      id: connectionData.id || this.generateId(),
      name: connectionData.name,
      type: connectionData.type,
      host: connectionData.host,
      port: connectionData.port,
      database: connectionData.database,
      username: connectionData.username,
      password: connectionData.password, // En producción, debería estar encriptado
      ssl: connectionData.ssl || false,
      createdAt: connectionData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingIndex = this.savedConnections.findIndex(c => c.id === connection.id);
    if (existingIndex >= 0) {
      this.savedConnections[existingIndex] = connection;
    } else {
      this.savedConnections.push(connection);
    }

    this.saveConnections();
    return connection;
  }

  // Eliminar una conexión guardada
  deleteConnection(connectionId) {
    this.savedConnections = this.savedConnections.filter(c => c.id !== connectionId);
    this.saveConnections();
  }

  // Generar ID único
  generateId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Conectar a PostgreSQL
  async connectPostgreSQL(config) {
    const connectionId = config.connectionId || this.generateId();
    
    // Construir configuración del pool
    const poolConfig = {
      host: config.host,
      port: config.port || 5432,
      database: config.database,
      user: config.username,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 5, // Máximo de conexiones en el pool
    };
    
    // Solo incluir password si no está vacío
    if (config.password && config.password.trim() !== '') {
      poolConfig.password = config.password;
    }
    
    const pool = new PgPool(poolConfig);

    // Probar la conexión
    try {
      const client = await pool.connect();
      client.release();
      
      this.connections.set(connectionId, {
        type: 'postgresql',
        pool,
        config
      });

      return { success: true, connectionId };
    } catch (error) {
      await pool.end();
      throw error;
    }
  }

  // Conectar a MySQL
  async connectMySQL(config) {
    const connectionId = config.connectionId || this.generateId();
    
    // Construir configuración de conexión
    const connectionConfig = {
      host: config.host,
      port: config.port || 3306,
      database: config.database,
      user: config.username,
      ssl: config.ssl ? {} : false,
    };
    
    // Solo incluir password si no está vacío
    if (config.password && config.password.trim() !== '') {
      connectionConfig.password = config.password;
    }
    
    const connection = await mysql2.createConnection(connectionConfig);

    this.connections.set(connectionId, {
      type: 'mysql',
      connection,
      config
    });

    return { success: true, connectionId };
  }

  // Conectar a SQL Server
  async connectSQLServer(config) {
    const connectionId = config.connectionId || this.generateId();
    
    // Construir configuración del pool
    const poolConfig = {
      server: config.host,
      port: config.port || 1433,
      database: config.database,
      user: config.username,
      options: {
        encrypt: config.ssl || false,
        trustServerCertificate: true,
      },
    };
    
    // Solo incluir password si no está vacío
    if (config.password && config.password.trim() !== '') {
      poolConfig.password = config.password;
    }
    
    const pool = new sql.ConnectionPool(poolConfig);

    try {
      await pool.connect();
      
      this.connections.set(connectionId, {
        type: 'sqlserver',
        pool,
        config
      });

      return { success: true, connectionId };
    } catch (error) {
      await pool.close();
      throw error;
    }
  }

  // Obtener drivers ODBC disponibles
  async getAvailableODBCDrivers() {
    try {
      const drivers = await odbc.drivers();
      return drivers;
    } catch (error) {
      console.error('Error obteniendo drivers ODBC:', error);
      return [];
    }
  }

  // Conectar a Visual FoxPro
  async connectVisualFoxPro(config) {
    const connectionId = config.connectionId || this.generateId();
    
    try {
      // Obtener drivers ODBC disponibles para detectar el nombre correcto
      const availableDrivers = await this.getAvailableODBCDrivers();
      const driverNames = availableDrivers.map(d => d.name || d).filter(Boolean);
      
      // Buscar drivers relacionados con FoxPro
      const foxProDrivers = driverNames.filter(name => 
        name.toLowerCase().includes('foxpro') || 
        name.toLowerCase().includes('fox pro') ||
        name.toLowerCase().includes('vfp')
      );
      
      // Visual FoxPro se conecta a través de ODBC
      // El campo 'database' puede ser un DSN o una ruta a la base de datos
      const databasePath = config.database ? config.database.trim() : '';
      
      if (!databasePath) {
        throw new Error('Se requiere especificar un DSN o la ruta a la base de datos Visual FoxPro');
      }
      
      // Detectar si es un DSN o una ruta
      const isPath = databasePath.includes('\\') || databasePath.includes('/') || databasePath.includes(':');
      
      if (!isPath) {
        // Es un DSN - conexión simple
        let connectionString = `DSN=${databasePath}`;
        
        // Agregar credenciales si se proporcionan
        if (config.username && config.username.trim() !== '') {
          connectionString += `UID=${config.username};`;
        }
        if (config.password && config.password.trim() !== '') {
          connectionString += `PWD=${config.password};`;
        }
        
        const connection = await odbc.connect(connectionString);
        
        this.connections.set(connectionId, {
          type: 'visualfoxpro',
          connection,
          config
        });

        return { success: true, connectionId };
      } else {
        // Es una ruta - normalizar separadores de ruta
        const normalizedPath = databasePath.replace(/\//g, '\\');
        
        // Verificar que la ruta existe
        if (!fs.existsSync(normalizedPath)) {
          throw new Error(`La ruta especificada no existe: ${normalizedPath}`);
        }
        
        // Verificar que sea un directorio
        const stats = fs.statSync(normalizedPath);
        if (!stats.isDirectory()) {
          throw new Error(`La ruta debe ser un directorio, no un archivo: ${normalizedPath}`);
        }
        
        // Construir lista de drivers a probar
        let driversToTry = [];
        
        if (foxProDrivers.length > 0) {
          // Usar los drivers encontrados
          driversToTry = foxProDrivers;
        } else {
          // Usar nombres comunes de drivers
          driversToTry = [
            'Microsoft Visual FoxPro Driver',
            'Visual FoxPro Driver',
            'Microsoft Visual FoxPro ODBC Driver',
            'VFPODBC Driver'
          ];
        }
        
        // Construir diferentes formatos de conexión para cada driver
        const connectionStrings = [];
        
        for (const driverName of driversToTry) {
          connectionStrings.push(
            `Driver={${driverName}};SourceType=DBF;SourceDB=${normalizedPath};Exclusive=No;Null=Yes;Deleted=Yes;`,
            `Driver={${driverName}};SourceType=DBF;SourceDB=${normalizedPath};Exclusive=No;`,
            `Driver={${driverName}};SourceType=DBC;SourceDB=${normalizedPath};Exclusive=No;`,
            `Driver={${driverName}};SourceDB=${normalizedPath};Exclusive=No;`
          );
        }
        
        // Si no se encontraron drivers, agregar intentos con nombres estándar
        if (foxProDrivers.length === 0) {
          connectionStrings.push(
            `Driver={Microsoft Visual FoxPro Driver};SourceType=DBF;SourceDB=${normalizedPath};Exclusive=No;Null=Yes;Deleted=Yes;`,
            `Driver={Visual FoxPro Driver};SourceType=DBF;SourceDB=${normalizedPath};Exclusive=No;`
          );
        }
        
        let lastError = null;
        let triedConnections = [];
        
        // Intentar cada formato de conexión hasta que uno funcione
        for (let i = 0; i < connectionStrings.length; i++) {
          const connStr = connectionStrings[i];
          try {
            // Agregar credenciales si se proporcionan
            let finalConnectionString = connStr;
            if (config.username && config.username.trim() !== '') {
              finalConnectionString += `UID=${config.username};`;
            }
            if (config.password && config.password.trim() !== '') {
              finalConnectionString += `PWD=${config.password};`;
            }
            
            triedConnections.push(`Intento ${i + 1}: ${connStr.substring(0, 100)}...`);
            
            const connection = await odbc.connect(finalConnectionString);
            
            this.connections.set(connectionId, {
              type: 'visualfoxpro',
              connection,
              config
            });

            return { success: true, connectionId };
          } catch (err) {
            lastError = err;
            const errorMsg = err.message || err.toString();
            triedConnections.push(`Intento ${i + 1} falló: ${errorMsg.substring(0, 100)}`);
            // Continuar con el siguiente formato
            continue;
          }
        }
        
        // Si ninguno funcionó, lanzar el último error con información detallada
        const errorDetails = triedConnections.join('\n');
        const errorMessage = lastError?.message || lastError?.toString() || 'No se pudo establecer la conexión';
        
        let driverInfo = '';
        if (foxProDrivers.length > 0) {
          driverInfo = `\nDrivers FoxPro encontrados: ${foxProDrivers.join(', ')}`;
        } else {
          driverInfo = `\n⚠️ NO se encontraron drivers de Visual FoxPro instalados.\nDrivers ODBC disponibles: ${driverNames.length > 0 ? driverNames.slice(0, 10).join(', ') : 'Ninguno'}`;
        }
        
        throw new Error(
          `Error al conectar a Visual FoxPro con la ruta: ${normalizedPath}\n\n` +
          `Último error: ${errorMessage}\n\n` +
          `${driverInfo}\n\n` +
          `Intentos realizados:\n${errorDetails}\n\n` +
          `SOLUCIÓN:\n` +
          `1. Instala el controlador ODBC de Visual FoxPro:\n` +
          `   - Descarga desde: https://www.microsoft.com/en-us/download/details.aspx?id=14839\n` +
          `   - O instala Visual FoxPro que incluye el driver\n` +
          `2. Verifica en Panel de Control > Herramientas administrativas > Orígenes de datos ODBC (64-bit)\n` +
          `   - Ve a la pestaña "Controladores"\n` +
          `   - Busca "Microsoft Visual FoxPro Driver"\n` +
          `3. Si el driver está instalado pero no se detecta, crea un DSN:\n` +
          `   - En ODBC, crea un nuevo DSN de usuario o sistema\n` +
          `   - Selecciona "Microsoft Visual FoxPro Driver"\n` +
          `   - Configura la ruta: ${normalizedPath}\n` +
          `   - Usa el nombre del DSN en lugar de la ruta`
        );
      }
    } catch (error) {
      // Mejorar el mensaje de error
      const errorMessage = error.message || error.toString();
      throw new Error(`Error al conectar a Visual FoxPro: ${errorMessage}`);
    }
  }

  // Conectar a una base de datos
  async connect(config) {
    const connectionId = config.connectionId || this.generateId();
    
    try {
      switch (config.type) {
        case 'postgresql':
          return await this.connectPostgreSQL({ ...config, connectionId });
        case 'mysql':
          return await this.connectMySQL({ ...config, connectionId });
        case 'sqlserver':
          return await this.connectSQLServer({ ...config, connectionId });
        case 'visualfoxpro':
          return await this.connectVisualFoxPro({ ...config, connectionId });
        default:
          throw new Error(`Tipo de base de datos no soportado: ${config.type}`);
      }
    } catch (error) {
      throw new Error(`Error al conectar: ${error.message}`);
    }
  }

  // Ejecutar consulta SQL
  async executeQuery(connectionId, query) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error('Conexión no encontrada');
    }

    const startTime = Date.now();

    try {
      let result;
      
      switch (conn.type) {
        case 'postgresql':
          result = await conn.pool.query(query);
          return {
            rows: result.rows,
            rowCount: result.rowCount,
            columns: result.fields?.map(f => ({ name: f.name, type: f.dataTypeID })) || [],
            executionTime: Date.now() - startTime
          };
        
        case 'mysql':
          const [rows, fields] = await conn.connection.execute(query);
          return {
            rows: rows,
            rowCount: rows.length,
            columns: fields?.map(f => ({ name: f.name, type: f.type })) || [],
            executionTime: Date.now() - startTime
          };
        
        case 'sqlserver':
          const request = conn.pool.request();
          const sqlResult = await request.query(query);
          
          // Extraer columnas de manera serializable
          let columns = [];
          if (sqlResult.recordset && sqlResult.recordset.length > 0) {
            // Obtener nombres de columnas de la primera fila
            const firstRow = sqlResult.recordset[0];
            if (firstRow && typeof firstRow === 'object') {
              columns = Object.keys(firstRow).map(key => ({
                name: key,
                type: typeof firstRow[key]
              }));
            }
          } else if (sqlResult.recordset && sqlResult.recordset.columns) {
            // Si hay información de columnas pero no filas, extraer de columns
            const columnKeys = Object.keys(sqlResult.recordset.columns);
            columns = columnKeys.map(key => ({
              name: key,
              type: 'unknown'
            }));
          }
          
          // Convertir filas a objetos planos serializables
          const serializableRows = (sqlResult.recordset || []).map(row => {
            const plainRow = {};
            if (row && typeof row === 'object') {
              for (const key in row) {
                if (row.hasOwnProperty(key)) {
                  // Convertir valores a tipos primitivos serializables
                  const value = row[key];
                  if (value === null || value === undefined) {
                    plainRow[key] = null;
                  } else if (value instanceof Date) {
                    plainRow[key] = value.toISOString();
                  } else if (Buffer.isBuffer(value)) {
                    plainRow[key] = value.toString('base64');
                  } else if (typeof value === 'object') {
                    // Intentar serializar objetos complejos
                    try {
                      const serialized = JSON.parse(JSON.stringify(value));
                      // Si el resultado es un objeto simple, mantenerlo; si no, convertir a string
                      if (typeof serialized === 'object' && serialized !== null && !Array.isArray(serialized)) {
                        plainRow[key] = serialized;
                      } else {
                        plainRow[key] = String(value);
                      }
                    } catch {
                      plainRow[key] = String(value);
                    }
                  } else {
                    plainRow[key] = value;
                  }
                }
              }
            }
            return plainRow;
          });
          
          return {
            rows: serializableRows,
            rowCount: serializableRows.length,
            columns: columns,
            executionTime: Date.now() - startTime
          };
        
        case 'visualfoxpro':
          const vfpResult = await conn.connection.query(query);
          
          // Convertir resultado de ODBC a formato estándar
          const vfpRows = vfpResult.map(row => {
            const plainRow = {};
            for (const key in row) {
              if (row.hasOwnProperty(key)) {
                const value = row[key];
                if (value === null || value === undefined) {
                  plainRow[key] = null;
                } else if (value instanceof Date) {
                  plainRow[key] = value.toISOString();
                } else if (Buffer.isBuffer(value)) {
                  plainRow[key] = value.toString('base64');
                } else {
                  plainRow[key] = value;
                }
              }
            }
            return plainRow;
          });
          
          // Extraer columnas de la primera fila
          let vfpColumns = [];
          if (vfpRows.length > 0) {
            vfpColumns = Object.keys(vfpRows[0]).map(key => ({
              name: key,
              type: typeof vfpRows[0][key]
            }));
          }
          
          return {
            rows: vfpRows,
            rowCount: vfpRows.length,
            columns: vfpColumns,
            executionTime: Date.now() - startTime
          };
        
        default:
          throw new Error(`Tipo de base de datos no soportado: ${conn.type}`);
      }
    } catch (error) {
      throw new Error(`Error ejecutando consulta: ${error.message}`);
    }
  }

  // Obtener esquema de la base de datos (tablas)
  async getTables(connectionId) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error('Conexión no encontrada');
    }

    try {
      let query;
      
      switch (conn.type) {
        case 'postgresql':
          query = `
            SELECT table_name, table_schema
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name;
          `;
          break;
        
        case 'mysql':
          query = `
            SELECT table_name, table_schema
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            ORDER BY table_name;
          `;
          break;
        
        case 'sqlserver':
          query = `
            SELECT TABLE_NAME as table_name, TABLE_SCHEMA as table_schema
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_SCHEMA, TABLE_NAME;
          `;
          break;
        
        case 'visualfoxpro':
          // Visual FoxPro: obtener tablas desde INFORMATION_SCHEMA
          // Si INFORMATION_SCHEMA no está disponible, intentar con una consulta alternativa
          query = `
            SELECT TABLE_NAME as table_name, '' as table_schema
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME;
          `;
          break;
        
        default:
          throw new Error(`Tipo de base de datos no soportado: ${conn.type}`);
      }

      const result = await this.executeQuery(connectionId, query);
      return result.rows;
    } catch (error) {
      throw new Error(`Error obteniendo tablas: ${error.message}`);
    }
  }

  // Obtener procedimientos almacenados
  async getStoredProcedures(connectionId) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error('Conexión no encontrada');
    }

    try {
      let query;
      
      switch (conn.type) {
        case 'postgresql':
          query = `
            SELECT routine_name as procedure_name, routine_schema as procedure_schema
            FROM information_schema.routines
            WHERE routine_type = 'PROCEDURE'
            AND routine_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY routine_schema, routine_name;
          `;
          break;
        
        case 'mysql':
          query = `
            SELECT routine_name as procedure_name, routine_schema as procedure_schema
            FROM information_schema.routines
            WHERE routine_type = 'PROCEDURE'
            AND routine_schema = DATABASE()
            ORDER BY routine_name;
          `;
          break;
        
        case 'sqlserver':
          query = `
            SELECT ROUTINE_NAME as procedure_name, ROUTINE_SCHEMA as procedure_schema
            FROM INFORMATION_SCHEMA.ROUTINES
            WHERE ROUTINE_TYPE = 'PROCEDURE'
            ORDER BY ROUTINE_SCHEMA, ROUTINE_NAME;
          `;
          break;
        
        case 'visualfoxpro':
          // Visual FoxPro no tiene procedimientos almacenados en el sentido tradicional
          // Retornar array vacío
          return [];
        
        default:
          throw new Error(`Tipo de base de datos no soportado: ${conn.type}`);
      }

      const result = await this.executeQuery(connectionId, query);
      return result.rows;
    } catch (error) {
      throw new Error(`Error obteniendo procedimientos almacenados: ${error.message}`);
    }
  }

  // Obtener columnas de una tabla
  async getTableColumns(connectionId, schema, tableName) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error('Conexión no encontrada');
    }

    try {
      let query;
      
      switch (conn.type) {
        case 'postgresql':
          query = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = $2
            ORDER BY ordinal_position;
          `;
          const pgResult = await conn.pool.query(query, [schema || 'public', tableName]);
          return pgResult.rows;
        
        case 'mysql':
          query = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = DATABASE() AND table_name = ?
            ORDER BY ordinal_position;
          `;
          const [mysqlRows] = await conn.connection.execute(query, [tableName]);
          return mysqlRows;
        
        case 'sqlserver':
          query = `
            SELECT COLUMN_NAME as column_name, DATA_TYPE as data_type, 
                   IS_NULLABLE as is_nullable, COLUMN_DEFAULT as column_default
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = @tableName
            ORDER BY ORDINAL_POSITION;
          `;
          const request = conn.pool.request();
          request.input('schema', sql.VarChar, schema || 'dbo');
          request.input('tableName', sql.VarChar, tableName);
          const sqlResult = await request.query(query);
          return sqlResult.recordset;
        
        case 'visualfoxpro':
          // Visual FoxPro: obtener información de columnas
          query = `
            SELECT COLUMN_NAME as column_name, DATA_TYPE as data_type, 
                   IS_NULLABLE as is_nullable, COLUMN_DEFAULT as column_default
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '${tableName}'
            ORDER BY ORDINAL_POSITION;
          `;
          const vfpColumnsResult = await conn.connection.query(query);
          return vfpColumnsResult.map(row => ({
            column_name: row.COLUMN_NAME || row.column_name,
            data_type: row.DATA_TYPE || row.data_type,
            is_nullable: row.IS_NULLABLE || row.is_nullable,
            column_default: row.COLUMN_DEFAULT || row.column_default
          }));
        
        default:
          throw new Error(`Tipo de base de datos no soportado: ${conn.type}`);
      }
    } catch (error) {
      throw new Error(`Error obteniendo columnas: ${error.message}`);
    }
  }

  // Desconectar
  async disconnect(connectionId) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return;
    }

    try {
      switch (conn.type) {
        case 'postgresql':
          await conn.pool.end();
          break;
        case 'mysql':
          await conn.connection.end();
          break;
        case 'sqlserver':
          await conn.pool.close();
          break;
        case 'visualfoxpro':
          await conn.connection.close();
          break;
      }
    } catch (error) {
      console.error('Error al desconectar:', error);
    } finally {
      this.connections.delete(connectionId);
    }
  }

  // Desconectar todas las conexiones
  async disconnectAll() {
    const promises = Array.from(this.connections.keys()).map(id => this.disconnect(id));
    await Promise.all(promises);
  }
}

// Crear instancia única
const databaseService = new DatabaseService();

module.exports = databaseService;


