import inquirer from 'inquirer';
import chalk from 'chalk';

const { prompt } = inquirer;

import * as fs from 'node:fs';
import { channel } from 'node:diagnostics_channel';

function buildAccount(params) {
  prompt([
    {
      name: 'accountName',
      message: 'Digite um nome para a sua conta',
    },
  ])
    .then(({ accountName }) => {
      console.info(accountName);
      if (!fs.existsSync('accounts')) {
        fs.mkdirSync('accounts');
      }

      if (fs.existsSync(`accounts/${accountName}.json`)) {
        console.log(
          chalk.bgRed.black('Esta conta já existe, escolha outro nome !')
        );
        buildAccount();
      }
      fs.writeFileSync(
        `accounts/${accountName}.json`,
        `{"balance": 0}`,
        (err) => {
          console.error('DEU RUIM', err);
        }
      );
      console.log(chalk.green('Parabéns, a sua conta foi criada !'));
      operation();
    })
    .catch((err) => console.error('DEU RUIM', err));
}

function checkAccount(accountName) {
  if (!fs.existsSync(`accounts/${accountName}.json`)) {
    console.log(
      chalk.bgRed.black('Esta conta não existe, escolha outro nome !')
    );
    return false;
  }
  return true;
}

function createAccount() {
  console.log(chalk.bgGreen.black('Parabéns por escolher o nosso banco'));
  console.log(chalk.green('Defina as opções da sua conta a seguir'));
  buildAccount();
  return;
}

function addAmount(accountName, amount) {
  const accountData = getAccount(accountName);
  if (!amount) {
    console.error(
      chalk.bgRed.black('Ocorreu um erro, tente novamente mais tarde')
    );
    return deposit();
  }
  accountData.balance += Number(amount);
  fs.writeFileSync(
    `accounts/${accountName}.json`,
    JSON.stringify(accountData),
    (err) => {
      console.log(err);
    }
  );

  console.log(
    chalk.green(`Foi depositado o valor de R$${amount} em sua conta !`)
  );
}

function getAccount(accountName) {
  try {
    const accountJSON = fs.readFileSync(`accounts/${accountName}.json`, {
      encoding: 'utf8',
      flag: 'r',
    });

    return JSON.parse(accountJSON);
  } catch (err) {
    // Se ocorrer um erro ao ler o arquivo, a exceção será capturada aqui
    if (err.code === 'ENOENT') {
      return false;
    } else {
      return false;
    }
  }
}
function getAccountBalance() {
  prompt([
    {
      name: 'accountName',
      message: 'Qual o nome da sua conta ?',
    },
  ])
    .then(({ accountName }) => {
      if (!checkAccount(accountName)) {
        console.log(chalk.bgRed.black('A conta não existe, tente novamente'));
        return getAccountBalance();
      }
      const accountData = getAccount(accountName);
      console.log(
        chalk.bgBlue.black(
          `Olá, o saldo da sua conta é de R$${accountData.balance}`
        )
      );
      return operation();
    })
    .catch((err) => console.log(err));
}

function deposit() {
  prompt([
    {
      name: 'accountName',
      message: 'Qual o nome da sua conta ?',
    },
  ])
    .then(({ accountName }) => {
      if (!checkAccount(accountName)) {
        return deposit();
      }
      prompt([
        {
          name: 'amount',
          message: 'Quanto você deseja depositar ?',
        },
      ]).then(({ amount }) => {
        if (!+amount) {
          console.log(chalk.bgRed.black('Insira um valor válido'));
          return deposit();
        }
        addAmount(accountName, amount);
        operation();
      });
    })
    .catch((err) => console.error('DEU RUIM', err));
}

function removeAmount(accountName, amount) {
  const accountData = getAccount(accountName);
  if (!accountData) {
    console.log(chalk.bgRed.black('Conta não existe ! tente novamente'));
    return withDraw();
  }
  if (!amount) {
    console.log(chalk.bgRed.black('Ocorreu um erro, tente novamente'));
    return withDraw();
  }

  if (accountData.balance < amount) {
    console.log(chalk.bgRed.black('Saldo insuficiente para retirar !'));
    return withDraw();
  }

  accountData.balance -= Number(amount);

  fs.writeFileSync(
    `accounts/${accountName}.json`,
    JSON.stringify(accountData),
    (err) => {
      console.log(err);
    }
  );
  console.log(chalk.green(`Foi realizado um saque de ${amount} na sua conta`));
  return operation();
}

function withDraw() {
  inquirer
    .prompt([
      {
        name: 'accountName',
        message: 'Qual o nome da sua conta ?',
      },
    ])
    .then(({ accountName }) => {
      if (!checkAccount(accountName)) {
        console.log(chalk.bgRed.black('A conta não existe, tente novamente'));
        return withDraw();
      }
      prompt([
        {
          name: 'amount',
          message: 'Quanto você deseja sacar ?',
        },
      ])
        .then(({ amount }) => {
          removeAmount(accountName, amount);
        })
        .catch((err) => console.error(err));
    })
    .catch((err) => console.error(err));
}

function manageDeleteAccount(accountName) {
  const accountData = getAccount(accountName);
  if (accountData.balance > 0) {
    console.log(
      chalk.bgRed.black(
        `Ainda um há saldo de ${accountData.balance} sua conta, retire o dinheiro antes de prosseguir`
      )
    );
    return operation();
  } else {
    fs.unlinkSync(`accounts/${accountName}.json`, (err) => {
      console.error(err);
    });
    console.log(chalk.bgGreen.white('Conta Deletada !'));
    return operation();
  }
}

function deleteAccount() {
  prompt([
    {
      type: 'list',
      choices: ['Sim', 'Não'],
      name: 'accountDelete',
      message: 'Você realmente deseja excluir sua conta ?',
    },
  ])
    .then(({ accountDelete }) => {
      console.log(accountDelete);
      if (accountDelete === 'Não') {
        return operation();
      } else {
        prompt([
          {
            name: 'accountName',
            message: 'Qual o nome da sua conta ?',
          },
        ])
          .then(({ accountName }) => {
            manageDeleteAccount(accountName);
          })
          .catch((err) => console.log(err));
      }
    })
    .catch((err) => console.error(err));
}

function transfer() {
  prompt([
    {
      name: 'accountName',
      message: 'Qual o nome da sua conta ?',
    },
  ])
    .then(({ accountName }) => {
      const account = getAccount(accountName);
      if (!account) {
        console.log(chalk.bgRed.black('Esta conta não existe'));
        return operation();
      }
      prompt([
        {
          name: 'value',
          message: 'Quanto Deseja transferir ?',
        },
      ]).then(({ value }) => {
        if (value > account.balance) {
          console.log(chalk.bgRed.black('Você não possui saldo suficiente !'));
          return operation();
        }
        prompt([
          {
            name: 'payeeAcc',
            message: 'Para quem Deseja transferir ?',
          },
        ])
          .then(({ payeeAcc }) => {
            const payee = getAccount(payeeAcc);
            if (!payee) {
              console.log(chalk.bgRed.black('Esta conta não existe'));
              return operation();
            }
            account.balance -= +value;
            payee.balance += +value;
            fs.writeFileSync(
              `accounts/${accountName}.json`,
              JSON.stringify(account),
              (err) => {
                console.log(err);
              }
            );
            fs.writeFileSync(
              `accounts/${payeeAcc}.json`,
              JSON.stringify(payee),
              (err) => {
                console.log(err);
              }
            );
            console.log(
              chalk.green(`Foi realizada uma transferência de ${value}!`)
            );
            return operation();
          })
          .catch((err) => console.error(err));
      });
    })
    .catch((err) => console.error('DEU RUIM', err));
}

function operation() {
  prompt([
    {
      type: 'list',
      name: 'action',
      message: 'O que você deseja fazer ?',
      choices: [
        'Criar Conta',
        'Consultar Saldo',
        'Depositar',
        'Sacar',
        'Transferir',
        'Sair',
        'Excluir Conta',
      ],
    },
  ])
    .then((answer) => {
      const action = answer['action'];
      switch (action) {
        case 'Criar Conta':
          createAccount();
          break;
        case 'Consultar Saldo':
          getAccountBalance();
          break;
        case 'Depositar':
          deposit();
          break;
        case 'Sacar':
          withDraw();
          break;
        case 'Transferir':
          transfer();
          break;
        case 'Sair':
          console.log(chalk.bgBlue.black('Obrigado por usar o Accounts'));
          break;
        case 'Excluir Conta':
          deleteAccount();
          break;
        default:
          console.log(
            chalk.bgRed.black.bold('Ação não reconhecida, tente novamente')
          );
      }
    })
    .catch((err) => console.error('DEU RUIM', err));
}

operation();
