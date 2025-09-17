export const getCookie = (cname) => {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return decode(c.substring(name.length, c.length));
    }
  }
  return "";
}

export const decode = (param) => {
  return JSON.parse(decodeURIComponent(window.atob(param)))
}

export const encode = (param) => {
  return window.btoa(encodeURIComponent(JSON.stringify(param)))
}
