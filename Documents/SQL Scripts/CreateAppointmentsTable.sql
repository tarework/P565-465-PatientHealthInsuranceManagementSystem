CREATE TABLE appointments (
    did INT NOT NULL,
	pid INT NOT NULL,
    appointmentdate DATE NOT NULL,
    startTime TIME(0) NOT NULL,
    endTime TIME(0) NOT NULL,
    
	PRIMARY KEY (did, pid, appointmentdate, startTime),
    
	CONSTRAINT mustStartOnThirtyMinuteBoundary CHECK (
        DATEPART(MINUTE FROM startTime) % 30 = 0
        AND DATEPART(SECOND FROM startTime) = 0
    ),
    CONSTRAINT mustEndOnThirtyMinuteBoundary CHECK (
        DATEPART(MINUTE FROM endTime) % 30 = 0
        AND DATEPART(SECOND FROM endTime) = 0
    ),
    CONSTRAINT cannotStartBefore0900 CHECK (
        DATEPART(HOUR FROM startTime) >= 9
    ),
    CONSTRAINT cannotEndAfter1700 CHECK (
        DATEPART(HOUR FROM DATEADD(SECOND, 1, startTime)) < 17
    ),
    CONSTRAINT mustEndAfterStart CHECK (
        endTime > startTime
    )
);