CREATE TRIGGER ensureNewAppointmentsDoNotClash ON appointments
INSTEAD OF INSERT
AS
BEGIN
	DECLARE @did int,
			@appointmentdate DATE,
			@startTime TIME,
			@endTime TIME
	SELECT	@did = did,
			@appointmentdate = appointmentdate,
			@startTime = startTime,
			@endTime = endTime
	FROM INSERTED
		IF NOT dbo.slotIsAvailable(@did,
			CAST(CONCAT(@appointmentdate, ' ', @startTime) AS DATETIME2(0)),
			CAST(CONCAT(@appointmentdate, ' ', @endTime) AS DATETIME2(0))
		) = 1
		BEGIN
			RAISERROR('Appointment clashes with an existing appointment!', 16, 1);
			ROLLBACK TRANSACTION
		END
ELSE
	BEGIN	
		INSERT INTO appointments(did, pid, appointmentdate, startTime, endTime)
		SELECT did, pid, appointmentdate, startTime, endTime FROM INSERTED
	END
END; 
GO