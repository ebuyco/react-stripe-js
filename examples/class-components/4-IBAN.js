// @noflow

import React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {IbanElement, Elements, ElementsConsumer} from '../../src';

import {logEvent, Result, ErrorResult} from '../util';
import '../styles/common.css';

const ELEMENT_OPTIONS = {
  supportedCountries: ['SEPA'],
  style: {
    base: {
      fontSize: '18px',
      color: '#424770',
      letterSpacing: '0.025em',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

class CheckoutForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {name: '', email: '', errorMessage: null, paymentMethod: null};
  }

  handleSubmit = async (event) => {
    event.preventDefault();

    const {stripe, elements} = this.props;
    const {name, email} = this.state;

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    const ibanElement = elements.getElement(IbanElement);

    const payload = await stripe.createPaymentMethod({
      type: 'sepa_debit',
      sepa_debit: ibanElement,
      billing_details: {
        name,
        email,
      },
    });

    if (payload.error) {
      console.log('[error]', payload.error);
      this.setState({
        errorMessage: payload.error.message,
        paymentMethod: null,
      });
    } else {
      console.log('[PaymentMethod]', payload.paymentMethod);
      this.setState({
        paymentMethod: payload.paymentMethod,
        errorMessage: null,
      });
    }
  };

  render() {
    const {errorMessage, paymentMethod, name, email} = this.state;
    const {stripe} = this.props;
    return (
      <form onSubmit={this.handleSubmit}>
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          required
          placeholder="Jenny Rosen"
          value={name}
          onChange={(event) => {
            this.setState({name: event.target.value});
          }}
        />
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="jenny@example.com"
          required
          value={email}
          onChange={(event) => {
            this.setState({email: event.target.value});
          }}
        />
        <label htmlFor="iban">Bank Account</label>
        <IbanElement
          id="iban"
          onBlur={logEvent('blur')}
          onChange={logEvent('change')}
          onFocus={logEvent('focus')}
          onReady={logEvent('ready')}
          options={ELEMENT_OPTIONS}
        />
        {errorMessage && <ErrorResult>{errorMessage}</ErrorResult>}
        {paymentMethod && (
          <Result>Got PaymentMethod: {paymentMethod.id}</Result>
        )}
        <button type="submit" disabled={!stripe}>
          Pay
        </button>
      </form>
    );
  }
}

const InjectedCheckoutForm = () => (
  <ElementsConsumer>
    {({stripe, elements}) => (
      <CheckoutForm stripe={stripe} elements={elements} />
    )}
  </ElementsConsumer>
);

const stripePromise = loadStripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

const App = () => {
  return (
    <Elements stripe={stripePromise}>
      <InjectedCheckoutForm />
    </Elements>
  );
};

export default App;
