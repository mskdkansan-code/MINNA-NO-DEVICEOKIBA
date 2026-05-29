const params =
  new URLSearchParams(window.location.search);

const username =
  params.get("username");

const userProfile =
  document.getElementById("userProfile");

const userReviewGrid =
  document.getElementById("userReviewGrid");

async function loadUserPage() {

  if (!username) {

    userProfile.innerHTML = `
      <p class="empty-message">
        ユーザーが見つかりません。
      </p>
    `;

    return;
  }

  const { data: profile, error } =
    await window.supabaseClient
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

  if (error || !profile) {

    console.error(error);

    userProfile.innerHTML = `
      <p class="empty-message">
        ユーザーが見つかりません。
      </p>
    `;

    return;
  }

  userProfile.innerHTML = `

  <div class="profile-card">

    <div class="user-top">

      ${profile.avatar_url
      ? `
          <img
            src="${profile.avatar_url}"
            class="profile-avatar"
          >
        `
      : ""
    }

      <div class="user-main-info">

        <h2 class="profile-title">
          ${profile.username}
        </h2>

        ${profile.twitter
      ? `
            <a
              href="https://x.com/${profile.twitter.replace("@", "")}"
              target="_blank"
              class="twitter-link"
            >
              ${profile.twitter}
            </a>
          `
      : ""
    }

      </div>

    </div>

    ${profile.bio
      ? `
        <p class="profile-bio">
          ${profile.bio.trim()}
        </p>
      `
      : ""
    }

    ${profile.mouse ||
      profile.keyboard ||
      profile.mousepad ||
      profile.monitor ||
      profile.audio ||
      profile.sensitivity ||
      profile.main_game
      ? `
    <div class="device-setup">

      <h3>
        Device Setup
      </h3>

      <div class="device-setup-grid">

        ${profile.mouse ? `<p><span>Mouse</span>${profile.mouse}</p>` : ""}
        ${profile.keyboard ? `<p><span>Keyboard</span>${profile.keyboard}</p>` : ""}
        ${profile.mousepad ? `<p><span>Mousepad</span>${profile.mousepad}</p>` : ""}
        ${profile.monitor ? `<p><span>Monitor</span>${profile.monitor}</p>` : ""}
        ${profile.audio ? `<p><span>Audio</span>${profile.audio}</p>` : ""}
        ${profile.sensitivity ? `<p><span>Sensitivity</span>${profile.sensitivity}</p>` : ""}
        ${profile.main_game ? `<p><span>Main Game</span>${profile.main_game}</p>` : ""}

      </div>

    </div>
  `
      : ""
    }

  </div>

`;

  const { data: reviews, error: reviewsError } =
    await window.supabaseClient
      .from("reviews")
      .select("*")
      .eq("username", profile.username)
      .order("created_at", {
        ascending: false
      });

  if (reviewsError) {
    console.error(reviewsError);
    return;
  }

  if (reviews.length === 0) {

    userReviewGrid.innerHTML = `
      <p class="empty-message">
        まだレビューがありません。
      </p>
    `;

    return;
  }

  userReviewGrid.innerHTML =
    reviews.map((review) => {

      const ratingStars =
        Array.from({ length: 5 }, (_, index) => {
          return index < Math.round(review.rating)
            ? '<span class="star active">★</span>'
            : '<span class="star">★</span>';
        }).join("");

      return `

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

            </div>

          </article>

        </a>

      `;

    }).join("");

}

loadUserPage();