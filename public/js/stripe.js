import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe(
  'pk_test_51KanicSHVkrSSC3253sqO7izMre231O157g8hwRyktAjrMs2jq38Yee565H0qHIt0w3PPEGSpY9QZRPB44gqaW0X009zYKMj0U'
);

export const bookTour = async (tourId) => {
  try {
    // 1) get checkout-session from server
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create Checkout form + charge credit card
    // const stripe = await Stripe(
    //   'pk_test_51KanicSHVkrSSC3253sqO7izMre231O157g8hwRyktAjrMs2jq38Yee565H0qHIt0w3PPEGSpY9QZRPB44gqaW0X009zYKMj0U'
    // );
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('err', err);
  }
};
