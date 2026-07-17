const validator = {
  "device_id": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "request_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "requester": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "phone": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "fault_description": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "urgency": {
    "rules": [
      {
        "format": "int"
      },
      {
        "range": [
          { "value": 1, "text": "1" },
          { "value": 2, "text": "2" },
          { "value": 3, "text": "3" }
        ]
      }
    ],
    "defaultValue": 1
  },
  "status": {
    "rules": [
      {
        "format": "int"
      },
      {
        "range": [
          { "value": 1, "text": "1" },
          { "value": 2, "text": "2" },
          { "value": 3, "text": "3" },
          { "value": 4, "text": "4" }
        ]
      }
    ],
    "defaultValue": 1
  },
  "handler": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "handle_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "handle_result": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "remark": {
    "rules": [
      {
        "format": "string"
      }
    ]
  }
}

const enumConverter = {}

function filterToWhere(filter, command) {
  let where = {}
  for (let field in filter) {
    let { type, value } = filter[field]
    switch (type) {
      case "search":
        if (typeof value === 'string' && value.length) {
          where[field] = new RegExp(value)
        }
        break;
      case "select":
        if (value.length) {
          let selectValue = []
          for (let s of value) {
            selectValue.push(command.eq(s))
          }
          where[field] = command.or(selectValue)
        }
        break;
      case "range":
        if (value.length) {
          let gt = value[0]
          let lt = value[1]
          where[field] = command.and([command.gte(gt), command.lte(lt)])
        }
        break;
      case "date":
        if (value.length) {
          let [s, e] = value
          let startDate = new Date(s)
          let endDate = new Date(e)
          where[field] = command.and([command.gte(startDate), command.lte(endDate)])
        }
        break;
      case "timestamp":
        if (value.length) {
          let [startDate, endDate] = value
          where[field] = command.and([command.gte(startDate), command.lte(endDate)])
        }
        break;
    }
  }
  return where
}

export { validator, enumConverter, filterToWhere }
