CREATE DATABASE IF NOT EXISTS `YTRadio` /*!40100 DEFAULT CHARACTER SET utf8 */;

Use `YTRadio`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `History` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `PlayTime` bigint(16) NOT NULL,
  `DJ` int(11) NOT NULL,
  `ListenerCount` int(5) NOT NULL DEFAULT '0',
  `UpVotes` int(5) NOT NULL DEFAULT '0',
  `DownVotes` int(5) NOT NULL DEFAULT '0',
  `Saves` int(5) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Playlists` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Owner` int(11) NOT NULL,
  `Name` varchar(64) NOT NULL,
  `ContentsJSON` text NOT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `dup_name` (`Owner`,`Name`),
  KEY `ownerID_idx` (`Owner`),
  CONSTRAINT `ownerID` FOREIGN KEY (`Owner`) REFERENCES `Users` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Sessions` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Key` varchar(128) NOT NULL,
  `UserID` int(11) NOT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID`),
  KEY `userid_idx` (`UserID`),
  CONSTRAINT `userid` FOREIGN KEY (`UserID`) REFERENCES `Users` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Users` (
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
/*!40101 SET character_set_client = @saved_cs_client */;