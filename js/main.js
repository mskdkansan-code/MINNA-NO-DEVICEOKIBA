const reviewGrid =
  document.getElementById("reviewGrid");

const searchInput =
  document.getElementById("searchInput");

const filterButtons =
  document.querySelectorAll(".filter-buttons button");

let allReviews = [];

function displayReviews(items){

  if(items.length === 0){

    reviewGrid.classList.add("is-empty");

    reviewGrid.innerHTML = `

      <p class="empty-message">
        まだレビューが投稿されていません。
      </p>

    `;

    return;
  }

  reviewGrid.classList.remove("is-empty");
  reviewGrid.innerHTML = "";

  items.forEach((review) => {

    const ratingStars =
      Array.from({ length: 5 }, (_, index) => {
        return index < Math.round(review.rating)
          ? '<span class="star active">★</span>'
          : '<span class="star">★</span>';
      }).join("");

    const card = `
      <a
        href="./review.html?id=${review.id}"
        class="card-link"
      >

        <article class="card">

          <img
            src="${review.image}"
            alt="${review.title}"
          >

          <div class="card-content">

            <span class="category">
              ${review.category}
            </span>

            <h3>
              ${review.title}
            </h3>

            <p>
              ${review.description}
            </p>

            <div class="rating">
              ${ratingStars}
              <span class="rating-number">
                ${review.rating}
              </span>
            </div>

            <p class="posted-by">
              Posted by ${review.username}
            </p>

            <div class="card-meta-row">

              <p class="posted-date">
                ${new Date(review.created_at).toLocaleDateString("ja-JP")}
              </p>

              <span class="card-like-count">
                ♡ ${review.likes?.[0]?.count || 0}
              </span>

            </div>

          </div>

        </article>

      </a>
    `;

    reviewGrid.innerHTML += card;

  });

}

function applyFilters(){

  const keyword =
    searchInput.value.toLowerCase();

  const activeButton =
    document.querySelector(
      ".filter-buttons button.active"
    );

  const activeCategory =
    activeButton
      ? activeButton.dataset.category
      : "All";

  const filtered =
    allReviews.filter((review) => {

      const matchesKeyword =
        review.title.toLowerCase().includes(keyword)
        ||
        review.category.toLowerCase().includes(keyword)
        ||
        review.description.toLowerCase().includes(keyword)
        ||
        review.username.toLowerCase().includes(keyword);

      const matchesCategory =
        activeCategory === "All"
        ||
        review.category === activeCategory;

      return matchesKeyword && matchesCategory;

    });

  displayReviews(filtered);

}

async function loadReviews(){

  reviewGrid.classList.add("is-empty");

  reviewGrid.innerHTML = `
    <p class="empty-message">
      レビューを読み込み中...
    </p>
  `;

  const { data, error } =
    await window.supabaseClient
      .from("reviews")
      .select("*, likes(count)")
      .order("created_at", {
        ascending: false
      });

  if(error){

    console.error(error);

    return;
  }

  allReviews = data;

  displayReviews(allReviews);

}

searchInput.addEventListener("input", () => {

  applyFilters();

});

filterButtons.forEach((button) => {

  button.addEventListener("click", () => {

    filterButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    applyFilters();

  });

});

loadReviews();