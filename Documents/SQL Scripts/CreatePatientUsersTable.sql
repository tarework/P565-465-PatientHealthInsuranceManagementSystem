CREATE TABLE patientMedicalData (
    id int NOT NULL IDENTITY,
	PRIMARY KEY (id),
	address1 varchar(255) NULL,
	address2 varchar(255) NULL,
	state1 varchar(15) NULL,
	zipcode varchar(15) NULL,
	birthdate varchar(15) NULL,
	sex varchar(10) NULL,
	genderidentity varchar(25) NULL,
	height varchar(10) NULL,
	weight1 varchar(10) NULL,
	bloodtype varchar(5) NULL,
	bloodpressure varchar(10) NULL,
	smoke BIT NULL,
	smokefreq varchar(100) NULL,
	drink BIT NULL,
	drinkfreq varchar(100) NULL,
	caffeine BIT NULL,
	caffeinefreq varchar(100) NULL,
); 

CREATE TABLE patientUsers (
    id int NOT NULL IDENTITY,
	PRIMARY KEY (id),
    email varchar(255) NOT NULL,
	pword varchar(1024) NOT NULL,
	fname varchar(255) NOT NULL,
	lname varchar(255) NOT NULL,
	phonenumber varchar(50) NOT NULL,
	profilepicid varchar(255) NOT NULL,
	medicaldataid int
    FOREIGN KEY (medicalDataId) REFERENCES [dbo].[patientMedicalData](id)
); 