document.addEventListener("DOMContentLoaded", function () {
  // 1. Inisialisasi Animation On Scroll (AOS)
  AOS.init({
    duration: 800,
    once: false,
    mirror: true
  });

  // 2. Ambil Parameter Nama Tamu dari URL (?to=Nama+Tamu)
  const urlParams = new URLSearchParams(window.location.search);
  const guestParam = urlParams.get('to') || urlParams.get('n');
  if (guestParam) {
    const guestElem = document.getElementById('guest-name');
    if (guestElem) guestElem.innerText = guestParam;
  }

  // 3. Audio & Kontrol Pembukaan Undangan
  const btnOpen = document.getElementById('btn-open');
  const mainContent = document.getElementById('main-content');
  const coverSection = document.getElementById('cover');
  
  const coverMusic = document.getElementById('cover-music');
  const bgMusic = document.getElementById('bg-music');
  const musicBtn = document.getElementById('music-control');
  
  let isCoverPlaying = false;
  let isMainPlaying = false;

  // Function Putar Musik Cover
  function startCoverMusic() {
    if (coverMusic && !isCoverPlaying) {
      coverMusic.play().then(() => {
        isCoverPlaying = true;
      }).catch(err => {
        console.log("Autoplay diblokir browser, menunggu interaksi user.", err);
      });
    }
  }

  // Pemicu Otomatis Putar Lagu Cover saat ada sentuhan awal
  const triggerEvents = ['click', 'touchstart', 'scroll'];
  function autoPlayOnUserInteraction() {
    startCoverMusic();
    triggerEvents.forEach(event => {
      window.removeEventListener(event, autoPlayOnUserInteraction);
    });
  }
  triggerEvents.forEach(event => {
    window.addEventListener(event, autoPlayOnUserInteraction, { once: true });
  });

  // Event Klik "Buka Undangan"
  if (btnOpen) {
    btnOpen.addEventListener('click', function (e) {
      e.stopPropagation();

      // Hentikan Lagu Cover
      if (coverMusic) {
        coverMusic.pause();
        coverMusic.currentTime = 0;
        isCoverPlaying = false;
      }

      // Animasi Pintu Terbuka jika ada class door-open
      if (coverSection) {
        coverSection.classList.add('door-open');
      }

      // Tampilkan Main Content
      if (mainContent) {
        mainContent.classList.remove('hide');
        mainContent.classList.add('fade-in-section');
      }

      // Tampilkan & Putar Musik Utama
      if (musicBtn) musicBtn.classList.remove('hide');
      playMainMusic();

      // Transisi Halus Menyembunyikan Cover
      setTimeout(() => {
        if (coverSection) coverSection.style.display = 'none';
        // Re-fresh AOS agar animasi elemen di main-content berjalan sempurna
        AOS.refresh();
      }, 600);
    });
  }

  // Fungsi Musik Utama
  function playMainMusic() {
    if (!bgMusic) return;
    bgMusic.play().then(() => {
      isMainPlaying = true;
      if (musicBtn) musicBtn.innerHTML = '<i class="fas fa-compact-disc fa-spin"></i>';
    }).catch(err => {
      console.log("Autoplay musik utama diblokir: ", err);
    });
  }

  function pauseMainMusic() {
    if (!bgMusic) return;
    bgMusic.pause();
    isMainPlaying = false;
    if (musicBtn) musicBtn.innerHTML = '<i class="fas fa-pause"></i>';
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', function () {
      if (isMainPlaying) {
        pauseMainMusic();
      } else {
        playMainMusic();
      }
    });
  }

  // 4. Hitung Mundur Waktu (Countdown)
  const targetDate = new Date("November 1, 2026 08:00:00").getTime();

  setInterval(function () {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance > 0) {
      const daysElem = document.getElementById("days");
      const hoursElem = document.getElementById("hours");
      const minutesElem = document.getElementById("minutes");
      const secondsElem = document.getElementById("seconds");

      if (daysElem) daysElem.innerText = Math.floor(distance / (1000 * 60 * 60 * 24));
      if (hoursElem) hoursElem.innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (minutesElem) minutesElem.innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      if (secondsElem) secondsElem.innerText = Math.floor((distance % (1000 * 60)) / 1000);
    }
  }, 1000);

  // 5. Konfirmasi Kado Via WhatsApp
  const formGift = document.getElementById('form-gift');
  if (formGift) {
    formGift.addEventListener('submit', function (e) {
      e.preventDefault();
      const nama = document.getElementById('gift-nama').value;
      const bank = document.getElementById('gift-bank').value;
      const nominal = document.getElementById('gift-nominal').value;
      const ucapan = document.getElementById('gift-ucapan').value;
      
      const phone = "6285655040797"; 
      const text = `Halo, saya ${nama}. Ingin mengonfirmasi kiriman kado/transfer via ${bank} sebesar Rp ${nominal}.\n\nUcapan: "${ucapan}"`;
      
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    });
  }

  // 6. Form RSVP & Kirim Ucapan (Google Sheets)
  const scriptURL = 'https://script.google.com/macros/s/AKfycbyV9xTu429kCxpgkmKDYp-2NJpclQ0CG9JP70WJ2ur8p4KUu98_qPrarsyPVF_NmNkS/exec';
  const formRsvp = document.getElementById('form-rsvp');
  const commentsList = document.getElementById('comments-list');

  function loadComments() {
    if (!commentsList) return;
    commentsList.innerHTML = '<p style="font-size:0.8rem; color:#aaa; text-align:center;">Memuat ucapan...</p>';
    
    fetch(scriptURL)
      .then(response => response.json())
      .then(data => {
        commentsList.innerHTML = '';
        if (!data || data.length === 0) {
          commentsList.innerHTML = '<p style="font-size:0.8rem; color:#aaa; text-align:center;">Belum ada ucapan. Jadilah yang pertama!</p>';
          return;
        }
        
        data.reverse().forEach(item => {
          renderCommentCard(item.nama, item.status, item.ucapan);
        });
      })
      .catch(error => {
        console.error('Gagal memuat ucapan:', error);
        commentsList.innerHTML = '<p style="font-size:0.8rem; color:#aaa; text-align:center;">Gagal memuat ucapan.</p>';
      });
  }

  function renderCommentCard(nama, status, ucapan) {
    const commentCard = document.createElement('div');
    commentCard.className = 'comment-card';
    commentCard.style.cssText = "background: rgba(0,0,0,0.5); border: 1px solid var(--primary-gold); color: #fff; padding: 12px; border-radius: 8px; margin-top: 10px; font-size: 0.8rem;";
    commentCard.innerHTML = `<strong style="color: var(--secondary-gold);">${nama}</strong> <small>(${status})</small><p style="margin-top: 5px; color: #ddd;">${ucapan}</p>`;
    commentsList.appendChild(commentCard);
  }

  loadComments();

  if (formRsvp) {
    formRsvp.addEventListener('submit', function (e) {
      e.preventDefault();
      
      const submitBtn = formRsvp.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.innerText = 'Mengirim...';
      submitBtn.disabled = true;

      const payload = {
        nama: document.getElementById('rsvp-nama').value,
        status: document.getElementById('rsvp-status').value,
        ucapan: document.getElementById('rsvp-ucapan').value
      };

      fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then(response => response.json())
      .then(data => {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        
        if (data.result === 'success') {
          formRsvp.reset();
          loadComments();
        } else {
          alert('Terjadi kesalahan saat mengirim ucapan. Silakan coba lagi.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        alert('Gagal terhubung ke server.');
      });
    });
  }

  // 7. Generator Burung Merpati
  const pigeonContainer = document.getElementById('butterfly-container');
  if (pigeonContainer) {
    const pigeonCount = 5;
    for (let i = 0; i < pigeonCount; i++) {
      createPigeon(i);
    }
  }

  function createPigeon(index) {
    const pigeon = document.createElement('div');
    pigeon.className = 'pigeon';

    const startLeft = Math.random() * 80 + 10;
    const delay = index * 2.5 + Math.random() * 2;
    const duration = 12 + Math.random() * 6;
    const scale = 0.6 + Math.random() * 0.4;

    pigeon.style.left = `${startLeft}%`;
    pigeon.style.animationDelay = `${delay}s`;
    pigeon.style.animationDuration = `${duration}s`;
    pigeon.style.transform = `scale(${scale})`;

    if (pigeonContainer) pigeonContainer.appendChild(pigeon);
  }
});

// Fungsi Salin Rekening
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Nomor rekening berhasil disalin: " + text);
  }).catch(err => {
    console.error('Gagal menyalin: ', err);
  });
}