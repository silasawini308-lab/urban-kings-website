const API_URL = 'http://localhost:5000/api';

const productDetail = document.getElementById('product-detail');
const reviewsContainer = document.getElementById('reviews-container');

const writeReviewButton = document.getElementById('write-review-button');

const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

function renderProductRating(avgRating, reviewCount) {
  const count = Number(reviewCount) || 0;
  const rating = Number(avgRating) || 0;

  if (count === 0) {
    return `
      <div class="product-detail-rating">
        <span class="stars">☆☆☆☆☆</span>
        <span class="review-count">No reviews yet</span>
      </div>
    `;
  }

  const rounded = Math.max(0, Math.min(5, Math.round(rating)));

  return `
    <div class="product-detail-rating">
      <span class="stars">
        ${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}
      </span>

      <span class="review-count">
        (${count})
      </span>
    </div>
  `;
}

function handleWriteReview() {
  if (!reviewsContainer) return;

  const existingForm = document.getElementById('review-form');

  if (existingForm) {
    existingForm.remove();
    return;
  }

  const reviewForm = document.createElement('form');

  reviewForm.id = 'review-form';
  reviewForm.className = 'review-form';

  reviewForm.innerHTML = `
    <div class="review-form-header">
      <h3>Write a Review</h3>
      <p>Share your experience with this product.</p>
    </div>

    <div class="review-form-group">
      <label>Your rating</label>

      <div class="rating-selector">
        <button type="button" class="rating-star" data-rating="1">☆</button>
        <button type="button" class="rating-star" data-rating="2">☆</button>
        <button type="button" class="rating-star" data-rating="3">☆</button>
        <button type="button" class="rating-star" data-rating="4">☆</button>
        <button type="button" class="rating-star" data-rating="5">☆</button>
      </div>

      <input
        type="hidden"
        id="review-rating"
        name="rating"
        value=""
      >
    </div>

    <div class="review-form-group">
      <label for="review-comment">Your review</label>

      <textarea
        id="review-comment"
        name="comment"
        maxlength="500"
        rows="5"
        placeholder="Tell us about your experience with this product..."
      ></textarea>

      <div class="review-character-count">
        <span id="review-character-count">0</span> / 500
      </div>
    </div>

    <div class="review-form-actions">
      <button
        type="button"
        id="cancel-review"
        class="review-cancel-button"
      >
        Cancel
      </button>

      <button
        type="submit"
        class="review-submit-button"
      >
        Submit Review
      </button>
    </div>
  `;

  reviewsContainer.prepend(reviewForm);

  setupReviewForm(reviewForm);
}

function setupReviewForm(form) {
  const ratingInput = form.querySelector('#review-rating');
  const ratingStars = form.querySelectorAll('.rating-star');

  const commentInput = form.querySelector('#review-comment');
  const characterCount =
    form.querySelector('#review-character-count');

  const cancelButton =
    form.querySelector('#cancel-review');

  ratingStars.forEach(star => {
    star.addEventListener('click', () => {
      const selectedRating = Number(star.dataset.rating);

      ratingInput.value = selectedRating;

      ratingStars.forEach(item => {
        const itemRating = Number(item.dataset.rating);

        item.textContent =
          itemRating <= selectedRating ? '★' : '☆';
      });
    });
  });

  commentInput.addEventListener('input', () => {
    characterCount.textContent =
      commentInput.value.length;
  });

  cancelButton.addEventListener('click', () => {
    form.remove();
  });

  form.addEventListener('submit', async event => {
  event.preventDefault();

  const rating = Number(ratingInput.value);
  const comment = commentInput.value.trim();

  if (!rating) {
    alert('Please select a rating.');
    return;
  }

  if (!comment) {
    alert('Please write a review.');
    return;
  }

  const submitButton =
    form.querySelector('.review-submit-button');

  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';

  try {
    const token = localStorage.getItem('token');

const response = await fetch(
 ` ${API_URL}/products/${productId}/reviews`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      rating,
      comment
    })
  }
);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || 'Could not submit your review.'
      );
    }

    alert('Your review has been submitted successfully.');

    form.remove();

    await loadReviews();

  } catch (error) {
    console.error('Review submission error:', error);

    alert(error.message);

    submitButton.disabled = false;
    submitButton.textContent = 'Submit Review';
  }
});
}


if (writeReviewButton) {
  writeReviewButton.addEventListener('click', handleWriteReview);
}

async function loadReviews() {
  if (!reviewsContainer) return;

  reviewsContainer.innerHTML = `
    <p class="reviews-loading">Loading reviews...</p>
  `;

  try {
    const response = await fetch(
      `${API_URL}/products/${productId}/reviews`
    );

    if (!response.ok) {
      throw new Error('Reviews request failed');
    }

    const reviews = await response.json();

    if (reviews.length === 0) {
      reviewsContainer.innerHTML = `
        <div class="reviews-summary">
          <span class="reviews-summary-stars">☆☆☆☆☆</span>
          <span class="reviews-summary-text">No reviews yet</span>
        </div>

        <div class="reviews-empty">
          Be the first to review this product.
        </div>
      `;

      return;
    }

    renderReviews(reviews);

  } catch (error) {
    console.error('Reviews loading error:', error);

    reviewsContainer.innerHTML = `
      <div class="reviews-empty">
        Reviews could not be loaded right now.
      </div>
    `;
  }
}

function showReviewReportForm(reviewId) {
  if (!reviewsContainer) return;

  const existingForm =
    document.getElementById('review-report-form');

  if (existingForm) {
    existingForm.remove();
    return;
  }

  const reportForm = document.createElement('form');

  reportForm.id = 'review-report-form';
  reportForm.className = 'review-report-form';

  reportForm.innerHTML = `
    <div class="review-report-header">
      <h3>Report this review</h3>

      <p>
        Help us keep the Urban Kings & Queens community respectful.
      </p>
    </div>

    <div class="review-report-group">

      <label>
        Why are you reporting it?
      </label>

      <label class="report-option">
        <input
          type="radio"
          name="report-reason"
          value="inappropriate"
        >
        <span>Inappropriate content</span>
      </label>

      <label class="report-option">
        <input
          type="radio"
          name="report-reason"
          value="spam"
        >
        <span>Spam</span>
      </label>

      <label class="report-option">
        <input
          type="radio"
          name="report-reason"
          value="offensive"
        >
        <span>Offensive language</span>
      </label>

      <label class="report-option">
        <input
          type="radio"
          name="report-reason"
          value="fake_or_misleading"
        >
        <span>Fake or misleading review</span>
      </label>

      <label class="report-option">
        <input
          type="radio"
          name="report-reason"
          value="other"
        >
        <span>Other</span>
      </label>

    </div>

    <div class="review-report-group">

      <label for="report-details">
        Additional details
      </label>

      <textarea
        id="report-details"
        name="details"
        maxlength="1000"
        rows="4"
        placeholder="Tell us more, if necessary..."
      ></textarea>

      <div class="report-character-count">
        <span id="report-character-count">0</span> / 1000
      </div>

    </div>

    <div class="review-report-actions">

      <button
        type="button"
        id="cancel-review-report"
        class="review-report-cancel"
      >
        Cancel
      </button>

      <button
        type="submit"
        class="review-report-submit"
      >
        Submit Report
      </button>

    </div>
  `;

  reviewsContainer.prepend(reportForm);

  setupReviewReportForm(reportForm, reviewId);
}

function setupReviewReportForm(form, reviewId) {
  const detailsInput =
    form.querySelector('#report-details');

  const characterCount =
    form.querySelector('#report-character-count');

  const cancelButton =
    form.querySelector('#cancel-review-report');

  detailsInput.addEventListener('input', () => {
    characterCount.textContent =
      detailsInput.value.length;
  });

  cancelButton.addEventListener('click', () => {
    form.remove();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const selectedReason =
      form.querySelector(
        'input[name="report-reason"]:checked'
      );

    const details =
      detailsInput.value.trim();

    if (!selectedReason) {
      alert('Please select a reason for reporting this review.');
      return;
    }

    const submitButton =
      form.querySelector('.review-report-submit');

    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'Please log in to report a review.'
        );
      }

      const response = await fetch(
        `${API_URL}/products/${productId}/reviews/${reviewId}/report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            reason: selectedReason.value,
            details
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Could not submit your report.'
        );
      }

      alert(
        'Thank you. Your report has been submitted successfully.'
      );

      form.remove();

    } catch (error) {
      console.error('Review report error:', error);

      alert(error.message);

      submitButton.disabled = false;
      submitButton.textContent = 'Submit Report';
    }
  });
}

function renderReviews(reviews) {
  if (!reviewsContainer) return;

  const total = reviews.length;

  const average =
    reviews.reduce((sum, review) => {
      return sum + Number(review.rating);
    }, 0) / total;

  const roundedAverage = Math.round(average);

  const summaryStars =
    '★'.repeat(roundedAverage) +
    '☆'.repeat(5 - roundedAverage);

  reviewsContainer.innerHTML = `
    <div class="reviews-summary">
      <span class="reviews-summary-stars">
        ${summaryStars}
      </span>

      <span class="reviews-summary-text">
        ${average.toFixed(1)} · Based on ${total} review${total === 1 ? '' : 's'}
      </span>
    </div>

    <div class="reviews-list">
      ${reviews.map(review => `
        <article class="review-item">

  <div class="review-item-author">
    <div class="review-author-avatar">
      ${review.full_name
        ? review.full_name.charAt(0).toUpperCase()
        : 'C'}
    </div>

    <div class="review-author-info">
      <strong>
        ${review.full_name || 'Customer'}
      </strong>

      <span class="verified-purchase">
        ✓ Verified Purchase
      </span>
    </div>
  </div>

  <div class="review-item-stars">
    ${
      '★'.repeat(Number(review.rating)) +
      '☆'.repeat(5 - Number(review.rating))
    }
  </div>

  <p class="review-item-comment">
    ${review.comment || 'No comment provided.'}
  </p>

  <div class="review-item-footer">

  <p class="review-item-meta">
    ${new Date(review.created_at).toLocaleDateString()}
  </p>

  <div class="review-item-actions">

    <button
      type="button"
      class="review-helpful-button"
      data-review-id="${review.id}"
    >
      👍 Helpful (${Number(review.helpful_count) || 0})
    </button>

    <button
      type="button"
      class="review-report-button"
      data-review-id="${review.id}"
    >
      Report
    </button>

  </div>

</div>

</article>

      `).join('')}
    </div>
  `;

  const helpfulButtons =
    reviewsContainer.querySelectorAll('.review-helpful-button');

    helpfulButtons.forEach(button => {
  const reviewId = button.dataset.reviewId;

  const review = reviews.find(
    item => String(item.id) === String(reviewId)
  );

  if (!review) return;

  let hasVoted = review.user_found_helpful === true;
  let helpfulCount = Number(review.helpful_count) || 0;

  if (hasVoted) {
    button.classList.add('active');
  }

  button.addEventListener('click', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Please log in to mark a review as helpful.');
      return;
    }

    button.disabled = true;

    try {
      const method = hasVoted ? 'DELETE' : 'POST';

      const response = await fetch(
        `${API_URL}/products/${productId}/reviews/${reviewId}/helpful`,
        {
          method,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Could not update your Helpful vote.'
        );
      }

      if (hasVoted) {
        helpfulCount = Math.max(0, helpfulCount - 1);
        hasVoted = false;

        button.classList.remove('active');
      } else {
        helpfulCount += 1;
        hasVoted = true;

        button.classList.add('active');
      }

      button.textContent =
        `👍 Helpful (${helpfulCount})`;

    } catch (error) {
      console.error('Helpful vote error:', error);

      alert(error.message);

    } finally {
      button.disabled = false;
    }
  });
});

const reportButtons =
  reviewsContainer.querySelectorAll('.review-report-button');

reportButtons.forEach(button => {
  const reviewId = button.dataset.reviewId;

  button.addEventListener('click', () => {
    showReviewReportForm(reviewId);
  });
});

}

async function loadProduct() {
  if (!productId) {
    productDetail.innerHTML = `
      <p class="product-error">
        No product was selected.
      </p>
    `;
    const addButton = productDetail.querySelector('.product-detail-cart');

addButton.addEventListener('click', () => {
  addToCart(product);
});
    return;
  }

  try {
    const response = await fetch(`${API_URL}/products/${productId}`);

    if (!response.ok) {
      throw new Error('Product request failed');
    }

    const product = await response.json();

    displayProduct(product);

  } catch (error) {
    console.error('Product loading error:', error);

    productDetail.innerHTML = `
      <p class="product-error">
        Could not load this product. Please try again.
      </p>
    `;
  }
}

function displayProduct(product) {
  const imageUrls =
  Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image_url
      ? [product.image_url]
      : [];

  productDetail.innerHTML = `
    <div class="product-gallery">

  <div class="product-detail-image">
    ${
      imageUrls.length > 0
        ? `<img
            id="main-product-image"
            src="${imageUrls[0]}"
            alt="${product.name}"
          >`
        : `<div class="product-no-image">
            No image available
          </div>`
    }
  </div>

  ${
    imageUrls.length > 0
      ? `
        <div class="product-thumbnails">
          ${imageUrls
            .map(
              (image, index) => `
                <button
                  type="button"
                  class="product-thumbnail ${index === 0 ? 'active' : ''}"
                  data-image="${image}"
                  aria-label="View product image ${index + 1}"
                >
                  <img src="${image}" alt="${product.name} view ${index + 1}">
                </button>
              `
            )
            .join('')}
        </div>
      `
      : ''
  }

</div>

    <div class="product-detail-info">

      <p class="product-detail-category">
        ${product.category}
      </p>

      <h2>${product.name}</h2>

      <p class="product-detail-price">
        GH₵ ${Number(product.price).toFixed(2)}
      </p>

      <p class="product-detail-stock">
        ${
          product.stock > 0
            ? `${product.stock} available`
            : 'Out of stock'
        }
      </p>

      <div class="product-purchase-status">
  <span class="purchase-status-dot"></span>

  <span>
    ${
      product.stock > 0
        ? 'In stock and ready to order'
        : 'Currently out of stock'
    }
  </span>
</div>

      ${renderProductRating(product.avg_rating, product.review_count)}

      <p class="product-detail-description">
        ${product.description || 'No description available.'}
      </p>

      <div class="quantity-heading">
  <p class="product-quantity-label">Quantity</p>

 ${
  product.stock > 0
    ? '<span>Maximum ' + product.stock + '</span>'
    : ''
}

</div>
        <div class="quantity-control">

          <button
            type="button"
            class="quantity-btn"
            id="quantity-decrease"
            aria-label="Decrease quantity"
          >
            −
          </button>

          <span id="quantity-value">1</span>

          <button
            type="button"
            class="quantity-btn"
            id="quantity-increase"
            aria-label="Increase quantity"
          >
            +
          </button>

        </div>
      </div>

      <button
        type="button"
        class="btn-add-cart product-detail-cart"
        ${product.stock <= 0 ? 'disabled' : ''}
      >
        ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
      </button>

      <div class="purchase-benefits">

  <div class="purchase-benefit">
    <span class="benefit-icon">✓</span>
    <div>
      <strong>Quality products</strong>
      <span>Selected for Kings & Queens</span>
    </div>
  </div>

  <div class="purchase-benefit">
    <span class="benefit-icon">✓</span>
    <div>
      <strong>Secure checkout</strong>
      <span>Your order is processed securely</span>
    </div>
  </div>

  <div class="purchase-benefit">
    <span class="benefit-icon">✓</span>
    <div>
      <strong>Delivery available</strong>
      <span>Delivery options shown during checkout</span>
    </div>
  </div>

</div>

    </div>
  `;

  let quantity = 1;

  const mainProductImage =
  productDetail.querySelector('#main-product-image');

const thumbnails =
  productDetail.querySelectorAll('.product-thumbnail');

thumbnails.forEach(thumbnail => {
  thumbnail.addEventListener('click', () => {
    if (!mainProductImage) return;

    mainProductImage.src = thumbnail.dataset.image;

    thumbnails.forEach(item => {
      item.classList.remove('active');
    });

    thumbnail.classList.add('active');
  });
});

  const quantityValue =
    productDetail.querySelector('#quantity-value');

  const decreaseButton =
    productDetail.querySelector('#quantity-decrease');

  const increaseButton =
    productDetail.querySelector('#quantity-increase');

  const addButton =
    productDetail.querySelector('.product-detail-cart');

  decreaseButton.addEventListener('click', () => {
    if (quantity > 1) {
      quantity -= 1;
      quantityValue.textContent = quantity;
    }
  });

  increaseButton.addEventListener('click', () => {
    if (quantity < product.stock) {
      quantity += 1;
      quantityValue.textContent = quantity;
    }
  });

  addButton.addEventListener('click', () => {
    addToCart(product, quantity);
  });
}

loadProduct();
loadReviews();