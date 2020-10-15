const azure = require('azure-storage');
const { AZURE_STORAGE_KEY } = require('./constants');
const dataUriToBuffer = require('data-uri-to-buffer');
const FileType = require('file-type');
const winston = require('winston/lib/winston/config');
const blobService = azure.createBlobService("apollocare", AZURE_STORAGE_KEY);

module.exports = async (container, name, stream) => {
	const buffer = dataUriToBuffer(stream);
	const filetype = await FileType.fromBuffer(buffer);
	const options = { contentSettings: { contentType: filetype.mime } }

	return new Promise((resolve, reject) => {
		blobService.createContainerIfNotExists(container, {}, function(error, result, response) {
			if (error) {
				winston.error(error);
				reject(error);
			}
			blobService.createBlockBlobFromText(container, name, buffer, options, function(error, result, response){
				if (error) {
					winston.error(error);
					reject(error);
				}
				resolve({ result: result, response: response });
			});
		});
	});
}