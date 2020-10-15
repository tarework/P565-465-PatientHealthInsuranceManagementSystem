CREATE TABLE doctorReviews (
    id int NOT NULL IDENTITY,
	PRIMARY KEY (id),
	reviewername varchar(255) NULL,
	reviewerid int NULL,
	revieweename varchar(255) NULL,
	revieweeid int NULL,
	rating int NULL,
	reviewmessage  varchar(max) NULL
);

CREATE TABLE doctorDetails (
    id int NOT NULL,
	PRIMARY KEY (id),
	practicename varchar(255) NULL,
	address1 varchar(255) NULL,
	address2 varchar(255) NULL,
	city varchar(50) NULL,
	state1 varchar(15) NULL,
	zipcode varchar(15) NULL,
	npinumber varchar(10) NULL,
	specializations varchar(255) NULL
);

CREATE TABLE doctorUsers (
    id int NOT NULL IDENTITY,
	PRIMARY KEY (id),
    email varchar(255) NULL,
	pword varchar(1024) NULL,
	fname varchar(255) NULL,
	lname varchar(255) NULL,
	phonenumber varchar(50) NULL,
	goauth varchar(50) NULL
); 