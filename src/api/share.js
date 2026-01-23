export const shareGame = async (title, text) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
        url: window.location.href,
      });
    } catch (err) {
      console.log("Deling annulleret");
    }
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert("Link kopieret! Send det til en ven.");
  }
};