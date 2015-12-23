module.exports = {
  Keys:{
    YoutubeAPI: 'youtubeApiKey'
  },
  DB:{
    host : process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'abc123',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'ytradio'
  }  
}