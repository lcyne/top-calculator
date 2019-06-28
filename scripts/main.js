const expression = document.querySelector('#expression');
const result = document.querySelector('#result');
const buttons = document.querySelector('#buttons');

const parentheseErr = 'ERROR: parentheses mismatch';
const divideZeroErr = 'ERROR: divided by 0';
const genericErr = 'ERROR: unexpected error';
const enclosedNumber = /\(-?\d*\.?\d*\)/;
const number = /[^+−×÷^%()]-?\d*\.?\d*/;
const numbers = /[^+−×÷^%()]-?\d*\.?\d*/g;

// Last computed expression
let lastExpr = '';
// Buffers the expression the user was typing before they loaded the previous
let currentExpr = expression.textContent;
// Flags to keep this expression history working properly
let isDownLocked = true;
let isUpLocked = true;
// +1 (resp. -1) when user inputs an opening (resp. closing) parenthese
// Can't be negative
let parentheseBalance = 0;

const add = (a, b) => a + b;
const subtract = (a, b) => a - b;
const multiply = (a, b) => a * b;
const divide = (a, b) => a / b;
const pow = (x, n) => x ** n;
const percent = (a, b) => b / 100 * a;

const operate = (operand1, operand2, operator) => {
  if (operator === '+') return add(operand1, operand2);
  else if (operator === '−') return subtract(operand1, operand2);
  else if (operator === '×') return multiply(operand1, operand2);
  else if (operator === '÷') return divide(operand1, operand2);
  else if (operator === '^') return pow(operand1, operand2);
  else if (operator === '%') return percent(operand1, operand2);
  else if (!isOperator(operator)) {
    if (operand1) return operand1;
  }
  else return genericErr;
};

const hasParentheses = expr => /[()]/.test(expr);

const parseSimpleExpr = expr => {
  if (hasParentheses(expr)) {
    expr = expr.slice(1, -1);
  }
  let opIndex = expr.search(/[^\d.-]/);
  if (opIndex === -1) return [expr];
  let operand1 = +expr.slice(0, opIndex);
  let operand2 = +expr.slice(opIndex + 1);
  let operator = expr.charAt(opIndex);
  return [operand1, operand2, operator];
};

// Get the substring containing the operation with highest precedence
const getPriorityOp = expr => {
  if (hasParentheses(expr)) {
    if (enclosedNumber.test(expr)) {
      /** If there is an expression enclosed in parentheses, we simplify
       * it until it becomes a number. At that point we return the number
       * WITH its parentheses so that everything is simplified/replaced in
       * the expression.
       */
      return expr.match(enclosedNumber)[0];
    }
    let end = expr.indexOf(')');
    let start = expr.slice(0, end).lastIndexOf('(');
    expr = expr.slice(start + 1, end);
  }

  let opIndex = 0;
  if (expr.indexOf('^') !== -1) opIndex = expr.indexOf('^');
  else if (expr.indexOf('×') !== -1) opIndex = expr.indexOf('×');
  else if (expr.indexOf('÷') !== -1) opIndex = expr.indexOf('÷');
  else if (expr.indexOf('%') !== -1) opIndex = expr.indexOf('%');
  else if (expr.indexOf('−') !== -1) opIndex = expr.indexOf('−');
  else if (expr.indexOf('+') !== -1) opIndex = expr.indexOf('+');

  let leftOperand = getLastOperand(expr.slice(0, opIndex));
  let rightOperand = expr.slice(opIndex + 1).match(number);
  return leftOperand + expr.charAt(opIndex) + rightOperand;
};

// Simplifies the expression string until it's a number
const calculateExpression = expr => {
  while(Number.isNaN(+expr)) {
    let priorityOp = getPriorityOp(expr);
    let resultPriorityOp = operate(...parseSimpleExpr(priorityOp));
    if (resultPriorityOp === Infinity) {
      return divideZeroErr;
    }
    expr = expr.replace(priorityOp, resultPriorityOp);
  }
  return +expr;
};

/** Although the parentheses are counted as the expression is being written,
 * We need to update the count when switching between current/old expression.
 */
const countParentheses = expr => {
  return [...expr].reduce((parentheseBalance, char) => {
    if (char === '(') ++parentheseBalance;
    else if (char === ')') --parentheseBalance;
    return parentheseBalance;
  }, 0);
}

const isOperator = c => /[+−×÷^%]/.test(c);

const isNumberFloat = operand => /\./.test(operand);

const getLastOperand = expr => {
  let operands = expr.match(numbers);
  if (operands) {
    return operands[operands.length - 1];
  } else {
    return null;
  }
};

const resetCalculator = () => {
  expression.textContent = '';
  lastExpr = '';
  currentExpr = '';
  exprBuffer = '';
  result.textContent = 0;
  parentheseBalance = 0;
  isUpLocked = true;
  isDownLocked = true;
};

const backspace = (expr, lastChar) => {
  if (lastChar === '(') {
    parentheseBalance--;
  } else if (lastChar === ')') {
    parentheseBalance++;
  }
  expr.textContent = expr.textContent.slice(0, -1);
};

const updateResult = expr => {
  lastExpr = expr.textContent;
  isUpLocked = false;
  if (parentheseBalance !== 0) {
    result.textContent = parentheseErr;
  } else {
    result.textContent = calculateExpression(expr.textContent);
  }
  expr.textContent = '';
  parentheseBalance = 0;
};

const appendOperator = (expr, button, lastChar) => {
  if (isOperator(lastChar)) {
    expr.textContent = expr.textContent.slice(0, -1);
  }
  if (expr.textContent !== '' && lastChar !== '.' && lastChar !== '(') {
    expr.textContent += button.textContent;
  }
};

const appendFloatPoint = (expr, button, lastChar) => {
  let lastOperand = getLastOperand(expr.textContent);
  if (expr.textContent === '') {
    expr.textContent += button.textContent;
  } else if (!isNumberFloat(lastOperand) && lastChar !== ')') {
    expr.textContent += button.textContent;
  }
};

const appendParenthese = (expr, button, lastChar) => {
  if (expr.textContent.slice(-1) === '.') return;
  if (button.id === 'openParenthese') {
    if (isOperator(lastChar) || lastChar === '-' || lastChar === '(' ||
        expr.textContent === '') {
          expr.textContent += button.textContent;
          parentheseBalance++;
    }
  } else if (button.id === 'closeParenthese') {
    if (parentheseBalance >= 1 &&
        (/\d/.test(lastChar) || lastChar === ')')) { 
          expr.textContent += button.textContent;
          parentheseBalance--;
    }
  }
};

const appendDigits = (expr, digit, lastChar) => {
  let lastOperand = getLastOperand(expr.textContent);
  if (!lastOperand) {
    expr.textContent += digit;
  } else {
    if (/[1-9]/.test(digit)) {
      // Preventing leading zeroes
      if (lastOperand === '0') {
        // Can't use replace("lastOperand", `${digit}`), if there's more
        // than 1 occurence of lastOperand ; only the first would be replaced.
        let index = expr.textContent.lastIndexOf(lastOperand);
        let start = expr.textContent.slice(0, zeroIndex);
        expr.textContent = start + `${digit}${expr.textContent.slice(index)}`;
      } else if (lastChar !== ')') {
        expr.textContent += digit;
      }
    } else if (digit === '0') {
      // Preventing trailing zeroes
      if (isNumberFloat(lastOperand) || +lastOperand !== 0) {
        expr.textContent += '0';
      }
    }
  }
};

const changeLastOperandSign = (expr, lastChar) => {
  let lastOperand = getLastOperand(expr.textContent);
  if (!lastOperand) {
    if (lastChar === '-') {
      expr.textContent = expr.textContent.slice(0, -1);
    } else {
      expr.textContent += '-';
    }
  } else {
    // Can't use replace("lastOperand", `-${lastOperand}`), if there's more
    // than 1 occurence of lastOperand ; only the first would be replaced.
    let signIndex = expr.textContent.lastIndexOf(lastOperand);
    let exprStart = expr.textContent.slice(0, signIndex);
    if (/-/.test(lastOperand)) {
      expr.textContent = exprStart + expr.textContent.slice(signIndex + 1);
    } else {
      expr.textContent = exprStart + `-${expr.textContent.slice(signIndex)}`;
    }
  }
};

const updateExpr = (expr, button) => {
  expr.textContent = expr.textContent.trim();
  let lastChar = expr.textContent.slice(-1);

  if (button.id === 'clear') {
    resetCalculator();
  } else if (button.id === 'backspace') {
    backspace(expr, lastChar);
  } else if (button.id === 'equals') {
    updateResult(expr);
  } else if (button.classList.contains('operator')) {
    appendOperator(expr, button, lastChar);
  } else if (button.id === 'floatingPoint') {
    appendFloatPoint(expr, button, lastChar);
  } else if (button.classList.contains('parenthese')) {
    appendParenthese(expr, button, lastChar);
  } else if (button.id === 'sign') {
    changeLastOperandSign(expr, lastChar);
  } else if (/\d/.test(button.textContent)) {
    appendDigits(expr, button.textContent, lastChar);
  }
  // For display purposes I can't have an empty expression
  if (expr.textContent === '') {
    expr.textContent = '　';
  }
}

buttons.addEventListener('click', e => {
  if (e.target.tagName.toLowerCase() === 'button') {
    updateExpr(expression, e.target);
  }
});

// Support for keyboard input
window.addEventListener('keydown', e => {
  if (/Escape/i.test(String(e.key))) {
    const esc = document.querySelector('#clear');
    updateExpr(expression, esc);
  } else if (/Backspace/i.test(String(e.key))) {
    const back = document.querySelector('#backspace');
    updateExpr(expression, back);
  } else if (/Enter/i.test(String(e.key))) {
    const enter = document.querySelector('#equals');
    updateExpr(expression, enter);
  } else if (String(e.key) === 's') {
    const sign = document.querySelector('#sign');
    updateExpr(expression, sign);
  } else if (String(e.key) === '-') {
    const minus = document.querySelector('#subtract');
    updateExpr(expression, minus);
  } else if (String(e.key) === '*') {
    const mult = document.querySelector('#multiply');
    updateExpr(expression, mult);
  } else if (String(e.key) === '/') {
    const divi = document.querySelector('#divide');
    updateExpr(expression, divi);
  } else if (/ArrowUp/i.test(String(e.key))) {
    if (lastExpr === '' || isUpLocked) return;
    currentExpr = expression.textContent;
    expression.textContent = lastExpr;
    isUpLocked = true;
    isDownLocked = false;
    parentheseBalance = countParentheses(expression.textContent);
  } else if (/ArrowDown/i.test(String(e.key))) {
    if (isDownLocked) return;
    expression.textContent = currentExpr;
    isDownLocked = true;
    isUpLocked = false;
    parentheseBalance = countParentheses(expression.textContent);
  } else {
    [...buttons.children].forEach(button => {
      if (String(e.key) === button.textContent) {
        updateExpr(expression, button);
      }
    });
  }
});