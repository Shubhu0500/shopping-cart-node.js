// const { Result } = require('express-validator');

// const deleteProduct = (btn) => {
//   const prodId = btn.parentNode.querySelector('[name=productId').value;
//   const csrf = btn.parentNode.querySelector('[name=_csrf').value;

//   const productElement = btn.closest('article');

//   fetch('/admin/product/' + prodId, {
//     method: 'DELETE',
//     headers: { 'csrf-token': csrf },
//   })
//     .then((result) => {
//       return result.json();
//     })
//     .then((data) => {
//       console.log(data);
//       productElement.parentNode.removeChild(productElement);
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// };

const deleteProduct = (btn) => {
  const prodId = btn.parentNode.querySelector('[name=productId]').value;
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

  const productElement = btn.closest('article');

  fetch('/admin/product/' + prodId, {
    method: 'DELETE',
    headers: {
      'csrf-token': csrf,
      'Content-Type': 'application/json',
    },
  })
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      console.log(data);
      if (data.redirectUrl) {
        // Redirect to the Shop page if the deletion was successful
        window.location.href = data.redirectUrl;
      } else {
        productElement.parentNode.removeChild(productElement);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

// Add event listener for all delete buttons
document.querySelectorAll('.delete-btn').forEach((button) => {
  button.addEventListener('click', () => {
    deleteProduct(button);
  });
});
