module.exports = {
  Keys:{
    YoutubeAPI: process.env.YOUTUBE_API_KEY || 'youtubeApiKey'
  },
  DB:{

    // Note: defaults are set assuming MySQL is running locally
    host : process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'abc123',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'ytradio'
  }  
}