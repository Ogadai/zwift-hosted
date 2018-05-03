
function errorMessage(ex) {
  return (ex && ex.response && ex.response.status)
      ? `- ${ex.response.status} (${ex.response.statusText})`
      : ex.message;
}

module.exports = {
  errorMessage
}
