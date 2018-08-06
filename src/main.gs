function getConfig(request) {
  var config = {
    configParams: [
      {
        type: "SELECT_SINGLE",
        name: "type",
        displayName: "Rankings Type",
        helpText: "Would you like to see team or individual rankings?",
        parameterControl: {
          allowOverride: true
        },
        options: [
          {
            label: "Individual",
            value: "individual"
          },
          {
            label: "Team",
            value: "team"
          }
        ]
      }
    ]
  };
  return config;
};

var individualRankingsDataSchema = [
  {
    name: 'user_full_name',
    label: 'Person Name',
    description: "The name of the person",
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION',
      semanticType: "TEXT",
      isReaggregatable: false
    }
  },
  {
    name: 'position',
    label: 'Position',
    description: "The rank of the person on the Spirit leaderboard",
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC',
      isReaggregatable: false
    }
  },
  {
    name: 'points',
    label: 'Points',
    description: "How many Spirit points the person has",
    isDefault: true,
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC',
      isReaggregatable: true
    }
  }
];

var teamRankingsDataSchema = [
  {
    name: 'team_name',
    label: 'Team Name',
    description: "The name of the team",
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION',
      semanticType: "TEXT",
      isReaggregatable: false
    }
  },
  {
    name: 'position',
    label: 'Position',
    description: "The rank of the team on the Spirit leaderboard",
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC',
      isReaggregatable: false
    }
  },
  {
    name: 'points',
    label: 'Points',
    description: "How many Spirit points the team has",
    isDefault: true,
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC',
      isReaggregatable: true
    }
  }
];

function getSchema(request) {
  switch(request.configParams.type){
    case 'individual':
      return {schema: individualRankingsDataSchema};
      break;
    case 'team':
      return {schema: teamRankingsDataSchema};
      break;
    default:
      console.error("Unknown type");
      break;
  }
};

function getData(request) {
  var dataSchema = [];
  var currentSchema = getSchema(request).schema;
  request.fields.forEach(function(field) {
    for (var i = 0; i < currentSchema.length; i++) {
      if (currentSchema[i].name === field.name) {
        dataSchema.push(currentSchema[i]);
        break;
      }
    }
  });

  var response = JSON.parse(UrlFetchApp.fetch("https://api.spiritapp.co/v2/rankings/" + request.configParams.type, {
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
        case 'team_name':
          values.push(ranking.team_name);
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
    .setScope("rankings.view")
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCallbackFunction('authCallback');
}

function authCallback(request) {
  return getOAuthService().handleCallback(request)
    ? HtmlService.createHtmlOutputFromFile('close.html')
    : HtmlService.createHtmlOutputFromFile('denied.html')
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

function isAdminUser(){
  return false;
}
