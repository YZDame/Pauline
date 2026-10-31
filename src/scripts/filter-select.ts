export function initializeFilterSelects(form: HTMLFormElement) {
  form.querySelectorAll<HTMLElement>("[data-select]").forEach((field) => {
    const select = field.querySelector("select");
    const trigger = field.querySelector("button");
    const menu = field.querySelector<HTMLElement>("[role=listbox]");
    const value = field.querySelector<HTMLElement>("[data-select-value]");
    const options = [...field.querySelectorAll<HTMLElement>("[role=option]")];
    if (!select || !trigger || !menu || !value || !options.length) return;

    let activeIndex = 0;
    let prefix = "";
    let lastTyped = 0;
    const isOpen = () => trigger.getAttribute("aria-expanded") === "true";
    const highlight = (index: number) => {
      activeIndex = Math.max(0, Math.min(index, options.length - 1));
      options.forEach((option, i) => option.classList.toggle("is-highlighted", i === activeIndex));
      const active = options[activeIndex];
      trigger.setAttribute("aria-activedescendant", active.id);
      active.scrollIntoView({ block: "nearest" });
    };
    const close = () => {
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("aria-activedescendant");
    };
    const sync = () => {
      if (select.selectedIndex < 0) select.value = "";
      value.textContent = select.selectedOptions[0]?.textContent ?? "";
      options.forEach((option) => option.setAttribute("aria-selected", String(option.dataset.value === select.value)));
      close();
    };
    const open = () => {
      // Closing another field also clears its active descendant.
      form.querySelectorAll<HTMLButtonElement>(".select-trigger[aria-expanded=true]").forEach((button) => {
        if (button !== trigger) button.click();
      });
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      highlight(select.selectedIndex);
    };
    const choose = (index: number) => {
      const option = options[index];
      if (!option) return;
      select.value = option.dataset.value ?? "";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      trigger.focus({ preventScroll: true });
    };

    trigger.addEventListener("click", () => isOpen() ? close() : open());
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (isOpen()) event.preventDefault();
        close();
      } else if (event.key === "Tab") {
        close();
      } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        if (!isOpen()) open();
        else if (event.key === "ArrowDown") highlight(activeIndex + 1);
        else if (event.key === "ArrowUp") highlight(activeIndex - 1);
        if (event.key === "Home") highlight(0);
        if (event.key === "End") highlight(options.length - 1);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (isOpen()) choose(activeIndex);
        else open();
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (!isOpen()) open();
        prefix = Date.now() - lastTyped < 600 ? prefix + event.key : event.key;
        lastTyped = Date.now();
        const index = options.findIndex((option) => option.textContent?.trim().toLocaleLowerCase().startsWith(prefix.toLocaleLowerCase()));
        if (index >= 0) highlight(index);
      }
    });
    menu.addEventListener("pointerdown", (event) => event.preventDefault());
    options.forEach((option, index) => {
      option.addEventListener("pointermove", () => highlight(index));
      option.addEventListener("click", () => choose(index));
    });
    document.addEventListener("pointerdown", (event) => {
      if (event.target instanceof Node && !field.contains(event.target)) close();
    });
    field.addEventListener("focusout", (event) => {
      if (!(event.relatedTarget instanceof Node) || !field.contains(event.relatedTarget)) close();
    });
    select.addEventListener("change", sync);
    form.addEventListener("reset", () => window.setTimeout(sync, 0));
    sync();
    select.hidden = true;
    trigger.hidden = false;
    field.querySelector("label")?.setAttribute("for", `${select.id}-trigger`);
    trigger.id = `${select.id}-trigger`;
  });
}
