let azure = require('azure-storage');
let {AZURE_STORAGE_KEY} = require('./constants');
let blobService = azure.createBlobService("apollocare", AZURE_STORAGE_KEY);
let dataUriToBuffer = require('data-uri-to-buffer');
let FileType = require('file-type');

module.exports = async (container, name, stream) => {

	let buffer = dataUriToBuffer(stream);
	let filetype = await FileType.fromBuffer(buffer);

	const options = { contentSettings: { contentType: filetype.mime } }

	blobService.createContainerIfNotExists(container, {
	  
	}, function(error, result, response) {
	  if (!error) {
	    blobService.createBlockBlobFromText(container, name, buffer, options, function(error, result, response) {
			  if (!error) {
			    // file uploaded
			  } else console.log(error);
			});
	  } else console.log(error);
	});
}