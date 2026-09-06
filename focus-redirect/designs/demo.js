const pad = (value) => String(value).padStart(2, "0");

function updateClocks() {
  const now = new Date();
  document.querySelectorAll("[data-live-clock]").forEach((clock) => {
    clock.textContent = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  });
  document.querySelectorAll("[data-live-date]").forEach((date) => {
    date.textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  });
}

function bindTaskComposer() {
  document.querySelectorAll("[data-composer]").forEach((composer) => {
    const input = composer.querySelector("input");
    const button = composer.querySelector("button");
    const list = document.querySelector(composer.dataset.target || "");
    if (!input || !button || !list) return;

    const add = () => {
      const value = input.value.trim();
      if (!value) return;
      const item = document.createElement("article");
      item.className = "demo-added-task";
      item.innerHTML = `<button aria-label="Complete task">○</button><span>${value.replace(
        /[&<>"']/g,
        (char) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          }[char])
      )}</span><small>${pad(new Date().getHours())}:${pad(
        (Math.ceil(new Date().getMinutes() / 5) * 5) % 60
      )}</small>`;
      item
        .querySelector("button")
        .addEventListener("click", () => item.classList.toggle("done"));
      list.prepend(item);
      input.value = "";
      input.focus();
    };

    button.addEventListener("click", add);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") add();
    });
  });
}

function bindPlaylists() {
  document.querySelectorAll("[data-playlist]").forEach((playlist) => {
    const audio = document.querySelector("[data-playlist-audio]");
    if (!audio) return;

    playlist.addEventListener("click", (event) => {
      const track = event.target.closest("[data-track]");
      if (!track) return;

      const wasActive = track.classList.contains("active") && !audio.paused;
      playlist.querySelectorAll("[data-track]").forEach((item) => item.classList.remove("active"));

      if (wasActive) {
        audio.pause();
        return;
      }

      const trackUrl = new URL(track.dataset.track, document.baseURI).href;
      if (audio.src !== trackUrl) audio.src = trackUrl;
      track.classList.add("active");
      audio.play().catch(() => track.classList.remove("active"));
    });

    audio.addEventListener("ended", () => {
      const tracks = [...playlist.querySelectorAll("[data-track]")];
      const current = tracks.findIndex((track) => track.classList.contains("active"));
      tracks[(current + 1) % tracks.length]?.click();
    });
  });
}

document.querySelectorAll("[data-check]").forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.toggle("done");
    button.setAttribute(
      "aria-pressed",
      String(button.classList.contains("done"))
    );
  });
});

updateClocks();
bindTaskComposer();
bindPlaylists();
setInterval(updateClocks, 1000);
