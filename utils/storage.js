const azure = require('azure-storage');
const { TOKEN_HEADER, AZURE_STORAGE_KEY } = require('./constants');
const dataUriToBuffer = require('data-uri-to-buffer');
const FileType = require('file-type');
const winston = require('winston/lib/winston/config');
const blobService = azure.createBlobService("apollocare", AZURE_STORAGE_KEY);

// This method is in here b/c
// patients, doctors, and insurance users
// can all do this.
// Don't write it 3 times,
// Extract it to a single location.
async function UpdateProfilePic(req, res) {
    token = user.DecodeAuthToken(req.header(TOKEN_HEADER));
    container = token.userType + token.id;
  
    UpdateFile(container, 'profile', req.body.img)
    .then((message)=> {
      return res.status(200).send({ result: message.result, response: message.response });
    }).catch((error)=> {
      return res.status(500).send({ error: error });
    });  
}

async function UpdateFile(container, name, stream) {
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


module.exports = { UpdateProfilePic };
