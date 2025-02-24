import logo from './k-icon-glow.png';
import { Component } from 'react';
import { CSVLink } from 'react-csv';
import { Grid } from 'react-loader-spinner';
import QRCode from 'react-qr-code';
import { format } from 'date-fns';
import { validateAddress } from './utils';
import { generateReport } from './report';
import './App.css';

const DONATION_ADDR = 'karlsen:qqhfdkxptlmwldafc9fggzss4vzvd6y0z5xtn404ydz0t0qqnlp5zm5xhlzdd';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      generated: false,
      ignoreCompound: false,
      ignoreSentToSelf: false,
      hasSuggestions: false,
      suggestedAddresses: [],
      reportData: [],
      addresses: ''
    };
  }

  beginReportGeneration() {
    this.setState({loading: true, generated: false, reportData: [], hasSuggestions: false, suggestedAddresses: []});

    const addresses = this.state.addresses.split('\n');

    const validAddresses = [];

    for (const address of addresses) {
      if (validateAddress(address)) {
        validAddresses.push(address);
      }
    }

    generateReport(addresses)
      .then(([txs, additionalAddressesFound = []]) => {
        const reportData = [
          [
            "Date",
            "Sent Amount",
            "Sent Currency",
            "Received Amount",
            "Received Currency",
            "Fee Amount",
            "Fee Currency",
            "Label",
            "Description",
            "TxHash",
          ]
        ];

        let prev = null;

        for (const tx of txs) {
          if (this.state.ignoreCompound && tx.compound) {
            continue;
          }

          if (this.state.ignoreSentToSelf && this.sendToSelf) {
            continue;
          }

          if (prev && prev.txHash === tx.txHash) {
            continue;
          } 

          const rowData = [tx.timestamp];

          if (tx.sendAmount) {
            rowData.push(tx.sendAmount);
            rowData.push('KLS');
          } else {
            rowData.push('');
            rowData.push('');
          }

          if (tx.receiveAmount) {
            rowData.push(tx.receiveAmount);
            rowData.push('KLS');
          } else {
            rowData.push('');
            rowData.push('');
          }

          if (tx.sendAmount && tx.feeAmount) {
            rowData.push(tx.feeAmount);
            rowData.push('KLS');
          } else {
            rowData.push('');
            rowData.push('');
          }

          if (tx.label) {
            rowData.push(tx.label);
          } else {
            rowData.push('');
          }

          if (tx.description) {
            rowData.push(tx.description);
          } else {
            rowData.push('');
          }

          rowData.push(tx.txHash);

          reportData.push(rowData);

          prev = tx;
        }

        this.setState({
          reportData,
          generated: true,
          hasSuggestions: additionalAddressesFound.length > 0,
          suggestedAddresses: additionalAddressesFound,
        });
      })
      .catch(console.error)
      .finally(() => {
        this.setState({loading: false});
      });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <span className="App-banner-text">Transaction Report</span>
        </header>

        <div className="AppContent">
          <span className="App-instructions">Add your karlsen addressess below (one per line) then click Generate to download your transaction history as a CSV file</span>
          <div className="column InputContainer">
            <textarea
              className="AddressesText"
              alt="karlsen:youradresseshere"
              placeholder='karlsen:youraddressesgoeshere'
              value={this.state.addresses}
              onChange={(event) => {this.setState({addresses: event.target.value})}}
              rows="5"
            >karlsen:youradresseshere</textarea>

            <label className="Checkboxes">
              <input
                type="checkbox"
                checked={this.state.ignoreCompound}
                onChange={() => {
                  this.setState({ignoreCompound: !this.state.ignoreCompound});
                }}
              />

              Ignore Compound Transactions
            </label>

            <label className="Checkboxes">
              <input
                type="checkbox"
                checked={this.state.ignoreSentToSelf}
                className="Checkboxes"
                onChange={() => {
                  this.setState({ignoreSentToSelf: !this.state.ignoreSentToSelf});
                }}
              />
              Ignore transactions sent to self
            </label>
          </div>
          <button
            onClick={this.beginReportGeneration.bind(this)}
            disabled={this.state.loading}>
              Generate
          </button>

          <Grid
            height="60"
            width="60"
            color = '#49EACB'
            ariaLabel="grid-loading"
            radius="12.5"
            wrapperStyle={{"marginTop": "1em"}}
            wrapperClass=""
            visible={this.state.loading}
          />

          {
            this.state.generated ?
            <CSVLink
              className="DownloadLink"
              data={this.state.reportData}
              filename={"karlsen-transactions-" + (format(new Date(), 'yyyyMMdd-HHmmss')) + ".csv"}
              target="_blank"
            >Download Report</CSVLink> :
            ''
          }

          {
            this.state.hasSuggestions ?
            <div className="column SuggestionSection">
              <span className="App-instructions">
                These addresses may also belong to you. Check them in the <a href="https://explorer.karlsencoin.com/" target="_blank" rel="noreferrer">explorer</a> and add them to your list if they are yours.
              </span>
              <textarea
                className="AddressesText"
                value={this.state.suggestedAddresses.join('\n')}
                readOnly={true}
                rows={Math.min(this.state.suggestedAddresses.length, 5)}
              ></textarea>
            </div>
            : ''
          }
        </div>

        <footer className="Footer">
          <div className="DonationQR">
            <QRCode style={{'width': '100%', 'height': '100%'}} value={DONATION_ADDR} />
          </div>
          <span>Found this useful? Consider donating at</span>
          <div className="DonationLink">
            <a href={'https://explorer.karlsencoin.com/addresses/' + DONATION_ADDR} rel="noreferrer" target="_blank">
              {DONATION_ADDR}
            </a>
          </div>
        </footer>
      </div>
    );
  }
}

export default App;
