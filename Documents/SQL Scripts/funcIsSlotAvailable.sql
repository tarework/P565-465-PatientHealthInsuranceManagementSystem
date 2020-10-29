CREATE FUNCTION slotIsAvailable(
    @did INT,
    @slotStartDateTime DATETIME2(0),
    @slotEndDateTime DATETIME2(0)
) RETURNS BIT 
BEGIN
    RETURN CASE WHEN EXISTS (
        SELECT 'TRUE'
        FROM appointments AS a
        WHERE
                CAST(@slotStartDateTime AS  TIME(0)) < a.endTime
            AND CAST(@slotEndDateTime AS    TIME(0)) > a.startTime
            AND a.did = @did
            AND a.appointmentdate = CAST(@slotStartDateTime AS  DATE)
    ) THEN 'FALSE' ELSE 'TRUE'
    END;
END; 
GO
