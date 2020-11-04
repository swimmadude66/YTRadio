CREATE DATABASE IF NOT EXISTS `ytradio` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;

USE `ytradio`;
CREATE TABLE IF NOT EXISTS `videos` (
  `videoID` varchar(100) NOT NULL,
  `Title` VARCHAR(500) NOT NULL,
  `Poster` varchar(200) DEFAULT NULL,
  `Thumbnails` longtext,
  `FormattedTime` varchar(100) NOT NULL DEFAULT '0:00',
  `Duration` int(22) NOT NULL DEFAULT '0',
  PRIMARY KEY (`videoID`),
  UNIQUE KEY `videoID_UNIQUE` (`videoID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `users` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Username` varchar(64) NOT NULL,
  `Email` varchar(128) NOT NULL,
  `Password` varchar(512) NOT NULL,
  `Salt` varchar(64) NOT NULL,
  `Role` enum('LISTENER','DJ','LIEUTENANT','COLONEL','GENERAL','HOST','ADMIN') NOT NULL DEFAULT 'LISTENER',
  `Confirm` varchar(64) NOT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Username_UNIQUE` (`Username`),
  UNIQUE KEY `Email_UNIQUE` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sessions` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Key` varchar(128) NOT NULL,
  `UserID` int(11) NOT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID`),
  KEY `userid_idx` (`UserID`),
  CONSTRAINT `userid` FOREIGN KEY (`UserID`) REFERENCES `users` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `playlists` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Owner` int(11) NOT NULL,
  `Name` varchar(64) NOT NULL,
  `ContentsJSON` longtext NOT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `dup_name` (`Owner`,`Name`),
  KEY `ownerID_idx` (`Owner`),
  CONSTRAINT `ownerID` FOREIGN KEY (`Owner`) REFERENCES `users` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `playlistcontents` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `PlaylistID` int(11) DEFAULT NULL,
  `VideoID` varchar(100) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Uniq_pl_vid` (`PlaylistID`,`VideoID`),
  KEY `videoID` (`VideoID`),
  KEY `PlaylistID` (`PlaylistID`),
  CONSTRAINT `FKplaylistID` FOREIGN KEY (`PlaylistID`) REFERENCES `playlists` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FKvideoID` FOREIGN KEY (`VideoID`) REFERENCES `videos` (`videoID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `history` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `PlayTime` bigint(16) NOT NULL,
  `DJ` int(11) NOT NULL,
  `ListenerCount` int(5) NOT NULL DEFAULT '0',
  `UpVotes` int(5) NOT NULL DEFAULT '0',
  `DownVotes` int(5) NOT NULL DEFAULT '0',
  `Saves` int(5) NOT NULL DEFAULT '0',
  `VideoID` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `DJ_idx` (`DJ`),
  KEY `Video_idx` (`VideoID`),
  CONSTRAINT `DJ` FOREIGN KEY (`DJ`) REFERENCES `users` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `Video` FOREIGN KEY (`VideoID`) REFERENCES `videos` (`videoID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
