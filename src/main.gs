function getConfig(request) {
  var config = {
    configParams: [
      {
        type: "INFO",
        name: "connect",
        text: "This connector does not require any configuration. Click CONNECT at the top right to get started."
      }
    ]
  };
  return config;
};

var rankingsDataSchema = [
  {
    name: 'user_full_name',
    label: 'Name',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {
    name: 'position',
    label: 'Position',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {
    name: 'points',
    label: 'Points',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  }
];

function getSchema(request) {
  return {schema: rankingDataSchema};
};

function getData(request) {
  var dataSchema = [];
  request.fields.forEach(function(field) {
    for (var i = 0; i < rankingsDataSchema.length; i++) {
      if (rankingsDataSchema[i].name === field.name) {
        dataSchema.push(rankingsDataSchema[i]);
        break;
      }
    }
  });

  var response = JSON.parse(UrlFetchApp.fetch("https://api.spiritapp.co/v2/rankings/individual", {
    headers: {
      Authorization: 'Bearer ' + getOAuthService().getAccessToken()
    }
  }));

  var data = [];
  response.forEach(function(ranking) {
    var values = [];
    dataSchema.forEach(function(field) {
      switch(field.name) {
        case 'user_full_name':
          values.push(ranking.user_full_name);
          break;
        case 'points':
          values.push(ranking.points);
          break;
        case 'position':
          values.push(ranking.position);
          break;
        default:
          values.push('');
      }
    });
    data.push({
      values: values
    });
  });

  return {
    schema: dataSchema,
    rows: data
  };
};

/**
 * OAUTH FUNCTIONS
 */

function getAuthType() {
  return {
    type: 'OAUTH2',
  };
}

function getOAuthService() {
  var scriptProps = PropertiesService.getScriptProperties();
  return OAuth2.createService('spirit')
    .setAuthorizationBaseUrl('https://api.spiritapp.co/oauth/authorize')
    .setTokenUrl('https://api.spiritapp.co/oauth/token')
    .setClientId(scriptProps.getProperty('OAUTH_CLIENT_ID'))
    .setClientSecret(scriptProps.getProperty('OAUTH_CLIENT_SECRET'))
    .setScope("VIEW_RANKINGS")
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCallbackFunction('authCallback');
}

function authCallback(request) {
  return getOAuthService().handleCallback(request)
    ? HtmlService.createHtmlOutput('Success! You can close this tab.')
    : HtmlService.createHtmlOutput('Denied. You can close this tab');
}

function isAuthValid() {
  return getOAuthService().hasAccess();
}

function resetAuth() {
  var auth = getOAuthService.reset();
  return getOAuthService.reset().reset();
}

function get3PAuthorizationUrls() {
  return getOAuthService().getAuthorizationUrl();
}
