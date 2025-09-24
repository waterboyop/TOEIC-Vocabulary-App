
export const speak = (text: string, lang: string = 'en-US'): void => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.cancel(); // Cancel any previous speech
    window.speechSynthesis.speak(utterance);
  } else {
    alert('Sorry, your browser does not support text-to-speech.');
  }
};
