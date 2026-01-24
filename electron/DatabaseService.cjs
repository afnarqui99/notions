const pg = require('pg');
const mysql2 = require('mysql2/promise');
const sql = require('mssql');
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
    
    const pool = new PgPool({
      host: config.host,
      port: config.port || 5432,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 5, // Máximo de conexiones en el pool
    });

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
    
    const connection = await mysql2.createConnection({
      host: config.host,
      port: config.port || 3306,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? {} : false,
    });

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
    
    const pool = new sql.ConnectionPool({
      server: config.host,
      port: config.port || 1433,
      database: config.database,
      user: config.username,
      password: config.password,
      options: {
        encrypt: config.ssl || false,
        trustServerCertificate: true,
      },
    });

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


