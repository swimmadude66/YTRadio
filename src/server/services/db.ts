import {Observable} from 'rxjs/Rx';
import {createPool, IPoolConfig, Pool, escape as mysqlEscape} from 'mysql';

export class Database {
    private pool: Pool;

    constructor(config?: IPoolConfig) {
        let poolconfig = Object.assign({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            database: process.env.DB_DATABASE || 'ytradio',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'admin',
            charset: 'utf8mb4' // needed since youtube allows emojis...
        }, config || {});

        this.pool = createPool(poolconfig);
    }

    public query(q, params?): Observable<any> {
        return Observable.create(observer => {
            this.pool.getConnection((err, conn) => {
                if (err) {
                    if (conn && conn.release) {
                        conn.release();
                    }
                    return observer.error(err);
                }
                conn.query(q, params || [], (error, result) => {
                    conn.release();
                    if (error) {
                        return observer.error(error);
                    }
                    observer.next(result);
                    observer.complete();
                });
            });
        });
    }

    public escape(value) {
        return mysqlEscape(value);
    }
}
