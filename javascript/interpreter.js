let fs = require('fs');
let process = require('process');
let esprima = require('esprima');

function interpretExpression(context, ret, expression) {
  switch (expression.type) {
  case 'Literal':
    ret.value = expression.value;
    break;
  case 'Identifier':
    ret.value = context[expression.name];
    break;
  case 'BinaryExpression':
    interpretBinaryExpression(context, ret, expression);
    break;
  case 'CallExpression':
    interpretCallExpression(context, ret, expression);
    break;
  default:
    console.error(`Unknown expression type ${expression.type}`);
    process.exit();
    break;
  }
}

function interpretBinaryExpression(context, ret, expression) {
  let left_ret = {};
  interpretExpression(context, left_ret, expression.left);
  let left = left_ret.value;

  let right_ret = {};
  interpretExpression(context, right_ret, expression.right);
  let right = right_ret.value;

  switch (expression.operator) {
  case '==':
    ret.value = left == right;
    break;
  case '+':
    ret.value = left + right;
    break;
  case '-':
    ret.value = left - right;
    break;
  default:
    console.error(`Unknown binary operator ${expression.operator}`);
    process.exit();
    break;
  }
}

function interpretCallExpression(context, ret, expression) {
  let func_ret = {};
  interpretExpression(context, func_ret, expression.callee);
  let func = func_ret.value;

  let values = [];
  for (let argument of expression.arguments) {
    let value_ret = {};
    interpretExpression(context, value_ret, argument);
    values.push(value_ret.value);
  }

  func(context, ret, values);
}

function interpretStatement(context, ret, statement) {
  if (statement === null) {
    return;
  }

  switch (statement.type) {
  case 'ExpressionStatement':
    interpretExpression(context, ret, statement.expression);
    break;
  case 'IfStatement':
    interpretIfStatement(context, ret, statement);
    break;
  case 'ReturnStatement':
    interpretReturnStatement(context, ret, statement);
    break;
  case 'BlockStatement':
    interpretBlockStatement(context, ret, statement);
    break;
  case 'FunctionDeclaration':
    interpretFunctionDeclaration(context, null, statement);
    break;
  default:
    console.error(`Unknown statement type ${statement.type}`);
    process.exit();
    break;
  }
}

function interpretIfStatement(context, ret, statement) {
  let test_ret = {};
  interpretExpression(context, test_ret, statement.test);
  let test = test_ret.value;

  if (test) {
    interpretStatement(context, ret, statement.consequent);
  } else {
    interpretStatement(context, ret, statement.alternate);
  }
}

function interpretReturnStatement(context, ret, statement) {
  let value_ret = {};
  interpretExpression(context, value_ret, statement.argument);
  ret.value = value_ret.value;
}

function interpretBlockStatement(context, ret, block) {
  for (let statement of block.body) {
    interpretStatement(context, ret, statement);
    if (ret.value !== undefined) {
      return;
    }
  }
}

function interpretFunctionDeclaration(context, ret, declaration) {
  context[declaration.id.name] = function(context, ret, args) {
    let child = Object.assign({}, context);
    for (let i = 0; i < declaration.params.length; i++) {
      child[declaration.params[i].name] = args[i];
    }
    interpretBlockStatement(child, ret, declaration.body);
  };
}

function interpret(context, program) {
  for (let statement of program.body) {
    interpretStatement(context, null, statement);
  }
}

let source = fs.readFileSync(process.argv[2]).toString();
let program = esprima.parseScript(source);
let context = {};
context['print'] = function(context, ret, args) {
  console.log(...args);
};
interpret(context, program);
