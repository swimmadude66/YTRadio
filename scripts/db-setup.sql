CREATE DATABASE IF NOT EXISTS `YTRadio` /*!40100 DEFAULT CHARACTER SET utf8 */;

Use `YTRadio`;

CREATE TABLE IF NOT EXISTS `Users` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `Sessions` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Key` varchar(64) NOT NULL,
  `Expires` bigint(16) NOT NULL,
  `UserID` int(11) NOT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID`),
  KEY `userID_idx` (`UserID`),
  CONSTRAINT `userID` FOREIGN KEY (`UserID`) REFERENCES `users` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `Playlists` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Owner` int(11) NOT NULL,
  `Name` varchar(64) NOT NULL,
  `ContentsJSON` text NOT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID`),
  KEY `ownerid_idx` (`Owner`),
  CONSTRAINT `ownerid` FOREIGN KEY (`Owner`) REFERENCES `users` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `History` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `PlayTime` bigint(16) NOT NULL,
  `DJ` int(11) NOT NULL,
  `ListenerCount` int(5) NOT NULL DEFAULT '0',
  `UpVotes` int(5) NOT NULL DEFAULT '0',
  `DownVotes` int(5) NOT NULL DEFAULT '0',
  `Saves` int(5) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;