var express = require("express"),
    empty = require('is-empty'),
    { poolPromise, doQuery, sql } = require('../db');

module.exports = (socket, io) => {

  socket.on('socketConnect', function(data) {

    try {
      let query = `select last_message_view.*, 
                  (select count(*) from messages where last_message_view.room_id = messages.room_id and messages.timestamp > last_message_view.time and messages.user_id <> @id and last_message_view.user_id = @id and last_message_view.user_type = @user_type) as unread,
                  (select messages.* from messages where last_message_view.room_id = messages.room_id order by timestamp desc, id desc FOR JSON PATH) as messages
                  from last_message_view where user_id = @id and user_type = @user_type;`;
      let params = [
          {name: 'id', sqltype: sql.Int, value: data.id},
          {name: 'user_type', sqltype: sql.VarChar(20), value: data.usertype}
      ];
      doQuery(null, query, params, function(selectData) {
        socket.emit('add_conversations', selectData.recordset.map(convo => ({...convo, messages: empty(JSON.parse(convo.messages)) ? [] : JSON.parse(convo.messages).reverse()})));
        selectData.recordset.forEach(function(convo) { socket.join(convo.room_id) });
      });
    } catch(e) {
      console.log(e);
    }

  });

  // socket.on('joinroom', function(data) {

  //   try {
  //     let query2 = `update last_message_view set time = GETDATE() where user_id = @user_id and room_id = @room_id and user_type = @user_type; 
  //                   select last_message_view.*, (select count(*) from messages where last_message_view.room_id = messages.room_id and messages.timestamp > last_message_view.time and messages.user_id <> @user_id and last_message_view.user_id = @user_id) as unread from last_message_view inner join jobs on last_message_view.job_id = jobs.id where last_message_view.job_id = @job_id and last_message_view.customer_included = @customer_included and user_id = @user_id and (jobs.status = 'In-Progress' or jobs.status = 'Scheduled');`;
  //     let params2 = [
  //       {name: 'job_id', sqltype: sql.Int, value: data.job_id},
  //       {name: 'customer_included', sqltype: sql.Bit, value: data.customer_included},
  //       {name: 'user_id', sqltype: sql.Int, value: data.user_id}
  //     ];
  //     doQuery(null, query2, params2, function(records2) {
  //       socket.emit('update_notifications', {...records2.recordset[0], room_id: `${data.customer_included ? "customer" : "worker"}${data.job_id}`});
  //     });
  //   } catch(e) {
  //     console.log(e);
  //   }

  // });

  // socket.on('leaveroom', function(data) {

  //   try {
  //     let query2 = `update last_message_view set time = GETDATE() where user_id = @user_id and job_id = @job_id and customer_included = @customer_included; 
  //                 select last_message_view.*, (select count(*) from messages where last_message_view.job_id = messages.job_id and last_message_view.customer_included = messages.customer_included and messages.timestamp > last_message_view.time and (messages.user_id <> @user_id or messages.is_customer = 1) and last_message_view.user_id = @user_id) as unread from last_message_view inner join jobs on last_message_view.job_id = jobs.id where last_message_view.job_id = @job_id and last_message_view.customer_included = @customer_included and user_id = @user_id and (jobs.status = 'In-Progress' or jobs.status = 'Scheduled');`;
  //     let params2 = [
  //       {name: 'job_id', sqltype: sql.Int, value: data.job_id},
  //       {name: 'customer_included', sqltype: sql.Bit, value: data.customer_included},
  //       {name: 'user_id', sqltype: sql.Int, value: data.user_id}
  //     ];
  //     doQuery(null, query2, params2, function(records2) {
  //       socket.emit('update_notifications', {...records2.recordset[0], room_id: `${data.customer_included ? "customer" : "worker"}${data.job_id}`});
  //     });
  //   } catch(e) {
  //     console.log(e);
  //   }

  // });

  socket.on("send_chat", (data) => {
    let query = "insert into messages (user_id, room_id, user_type, message) output inserted.* values (@user_id, @room_id, @user_type, @message);";
    let params = [
      {name: 'user_id', sqltype: sql.Int, value: data.id},
      {name: 'room_id', sqltype: sql.VarChar(20), value: data.room_id},
      {name: 'message', sqltype: sql.VarChar(1000), value: data.message},
      {name: 'user_type', sqltype: sql.VarChar(20), value: data.usertype}
    ];
    doQuery(null, query, params, function(records) {
      const record = records.recordset[0];
      io.in(`${data.room_id}`).emit('chat_received', [{...record}]);
    });
  });

  socket.on("user_typing", (data) => {
    io.in(`${data.room_id}`).emit('user_typing_received', data);
  });

};

