import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;
const themeButtons = document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]");

function updateThemeButtons() {
  const dark = root.dataset.theme === "dark";
  themeButtons.forEach((button) => {
    button.textContent = dark ? "浅色" : "深色";
    button.setAttribute("aria-label", dark ? "切换浅色模式" : "切换深色模式");
  });
}

updateThemeButtons();
themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = theme;
    try {
      localStorage.setItem("pauline-theme", theme);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
    updateThemeButtons();
  });
});

const mobileNav = document.querySelector<HTMLDetailsElement>("[data-mobile-nav]");
mobileNav?.addEventListener("toggle", () => {
  if (!mobileNav.open || reducedMotion.matches) return;
  const links = mobileNav.querySelectorAll("a");
  gsap.fromTo(links, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.28, stagger: 0.04, ease: "power2.out", clearProps: "opacity,transform" });
});

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => mobileNav.removeAttribute("open"));
});

document.querySelectorAll<HTMLDetailsElement>("details[data-animate]").forEach((details) => {
  details.addEventListener("toggle", () => {
    if (!details.open || reducedMotion.matches) return;
    const content = details.querySelector(".details-content");
    if (content) gsap.fromTo(content, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.32, ease: "power2.out", clearProps: "opacity,transform" });
  });
});

if (!reducedMotion.matches) {
  const enterItems = gsap.utils.toArray<HTMLElement>("[data-enter]");
  if (enterItems.length) {
    gsap.from(enterItems, {
      opacity: 0,
      y: 22,
      duration: 0.72,
      stagger: 0.065,
      ease: "expo.out",
      clearProps: "opacity,transform",
    });
  }

  gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
    const items = group.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!items.length) return;
    gsap.from(items, {
      opacity: 0,
      y: 22,
      duration: 0.68,
      stagger: 0.06,
      ease: "expo.out",
      clearProps: "opacity,transform",
      scrollTrigger: {
        trigger: group,
        start: "top 88%",
        once: true,
      },
    });
  });

  // 入场动画若因环境暂停（后台标签页、渲染被节流）而未执行，
  // 强制让仍处于隐藏状态的内容出现，保证阅读不受动效影响。
  window.setTimeout(() => {
    gsap.utils.toArray<HTMLElement>("[data-enter], [data-reveal]").forEach((el) => {
      if (Number(getComputedStyle(el).opacity) < 0.05) {
        gsap.set(el, { clearProps: "opacity,transform" });
      }
    });
  }, 2500);

  document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((element) => {
    gsap.to(element, {
      yPercent: -4,
      ease: "none",
      scrollTrigger: {
        trigger: element.closest("section") ?? element,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.3,
      },
    });
  });
}

const yearSections = document.querySelectorAll<HTMLElement>("[data-year-section]");
yearSections.forEach((section) => {
  const id = section.id;
  ScrollTrigger.create({
    trigger: section,
    start: "top 45%",
    end: "bottom 45%",
    onToggle: (self) => {
      if (!self.isActive) return;
      document.querySelectorAll("[data-year-link]").forEach((link) => {
        const active = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    },
  });
});

let navigating = false;
document.addEventListener("click", (event) => {
  if (navigating || reducedMotion.matches || event.defaultPrevented) return;
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest<HTMLAnchorElement>("a[href]");
  if (!link || link.matches("[data-work], [data-no-transition]") || link.target || link.hasAttribute("download")) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin || url.protocol !== "http:" && url.protocol !== "https:") return;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return;

  event.preventDefault();
  navigating = true;
  const go = () => {
    if (!navigating) return;
    navigating = false;
    window.location.href = url.href;
  };
  gsap.to("main", {
    opacity: 0,
    y: 6,
    duration: 0.16,
    ease: "power1.in",
    onComplete: go,
    onInterrupt: go,
  });
  window.setTimeout(go, 320);
});

window.addEventListener("pageshow", () => {
  navigating = false;
  gsap.set("main", { clearProps: "opacity,transform" });
});
