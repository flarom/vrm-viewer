function isMobile() {
    return window.innerWidth <= 800;
}

function isPc() {
    return !isMobile();
}

function toggleDropdown(menuId) {
    const menu = document.getElementById(menuId);
    const dropdown = menu.parentElement;

    document.querySelectorAll('.dropdown').forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('show');
        }
    });

    dropdown.classList.toggle('show');

    if (dropdown.classList.contains('show')) {
        const buttons = menu.querySelectorAll('button');
        if (buttons.length > 0) {
            setTimeout(() => buttons[0].focus(), 0);
        }

        menu.addEventListener('keydown', handleArrowNavigation);
        menu.addEventListener('keydown', handleActivation);
    } else {
        menu.removeEventListener('keydown', handleArrowNavigation);
        menu.removeEventListener('keydown', handleActivation);
    }
}

function handleArrowNavigation(e) {
    const buttons = Array.from(e.currentTarget.querySelectorAll('button'))
        .filter(btn => btn.offsetParent !== null);
    const currentIndex = buttons.findIndex(btn => btn === document.activeElement);

    if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        let nextIndex;

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % buttons.length;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        }

        buttons[nextIndex]?.focus();
    }
}

function handleActivation(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const active = document.activeElement;
        if (active && active.tagName === 'BUTTON') {
            e.preventDefault();

            active.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            active.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
    }
}

(function () {
	const tabs = document.querySelectorAll(".tab");
	const buttons = document.querySelectorAll(".tab-button");

	function activateTab(tabId) {
		// Tabs
		tabs.forEach(tab => {
			tab.classList.toggle("active", tab.id === tabId);
		});

		// Buttons
		buttons.forEach(btn => {
			btn.classList.toggle(
				"active",
				btn.id === "tab-btn-" + tabId
			);
		});
	}

	// Bind clicks
	buttons.forEach(btn => {
		btn.addEventListener("click", () => {
			const tabId = btn.id.replace("tab-btn-", "");
			activateTab(tabId);
		});
	});

	// Default tab
	activateTab("tab-model");
})();

function toggleSidebar(sidebarId) {
    const sidebar = document.getElementById(sidebarId);

    // document.querySelectorAll(".sidebar").forEach((s) => {
    //     if (s !== sidebar) {
    //         s.classList.remove("show");
    //     }
    // });

    sidebar.classList.toggle("show");

    if (sidebar.classList.contains("show")) {
        const buttons = sidebar.querySelectorAll(".file");
        if (buttons.length > 0) {
            buttons[0].focus();
        }

        sidebar.addEventListener("keydown", handleArrowNavigation);
    } else {
        sidebar.removeEventListener("keydown", handleArrowNavigation);
    }

    localStorage.setItem(`last${sidebarId}SidebarState`, sidebar.classList.contains("show"));
}

function showToast(message, icon = "", removePrevious = false) {
    if (removePrevious) {
        document.querySelectorAll(".toast").forEach((el) => el.remove());
    }

    const snackbar = document.createElement("div");
    snackbar.className = "toast show";
    snackbar.innerHTML = `<span class='icon' style='font-size:x-large'>${icon}</span><p>${message}</p>`;

    document.body.appendChild(snackbar);

    setTimeout(() => {
        snackbar.classList.remove("show");
        setTimeout(() => {
            snackbar.remove();
        }, 400);
    }, 3000);
}

function hideAllMenus() {
    document.querySelectorAll(".dropdown").forEach((dropdown) => {
        dropdown.classList.remove("show");
    });
}

function hideAllSidebars() {
    document.querySelectorAll(".sidebar").forEach((sidebar) => {
        sidebar.classList.remove("show");
    });
}
function closeAllDialogs() {
    document.querySelectorAll(".prompt-overlay").forEach((el) => el.remove());
}

function fadeOutAllDialogs() {
    document.querySelectorAll(".prompt-overlay").forEach((el) => {
        el.classList.add("fade-out");
        setTimeout(() => el.remove(), 500);
    });
}

function promptString(title, defaultText = "", warn = false) {
    return new Promise((resolve) => {
        // overlay
        const overlay = document.createElement("div");
        overlay.className = "prompt-overlay";

        // dialog
        const dialog = document.createElement("div");
        dialog.className = "prompt-dialog";
        dialog.style.padding = "20px";
        if (warn) dialog.classList.add("warn");

        // title
        const titleElement = document.createElement("p");
        titleElement.textContent = title;
        titleElement.className = "prompt-title";
        dialog.appendChild(titleElement);

        // field
        const input = document.createElement("input");
        input.type = "text";
        input.value = defaultText ? defaultText : "";
        dialog.appendChild(input);

        // buttons
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "prompt-buttons";

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.className = "prompt-button cancel";

        const submitButton = document.createElement("button");
        submitButton.textContent = "Ok";
        submitButton.className = "prompt-button submit";

        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(submitButton);
        dialog.appendChild(buttonContainer);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        input.focus();
        input.selectionStart = 0;
        input.selectionEnd = input.value.length;

        function closePrompt(result) {
            document.body.removeChild(overlay);
            resolve(result);
        }

        cancelButton.addEventListener("click", () => closePrompt(null));
        submitButton.addEventListener("click", () => closePrompt(input.value));

        overlay.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                closePrompt(input.value);
            } else if (event.key === "Escape") {
                closePrompt(null);
            }
        });
    });
}

function promptMessage(htmlContent, showCloseButton = true, useBigDialog = false, toolbarLeft = "", toolbarCenter = "", toolbarRight = "") {
    return new Promise((resolve) => {
        // overlay
        const overlay = document.createElement("div");
        overlay.className = "prompt-overlay";
        overlay.tabIndex = -1;

        // dialog
        const dialog = document.createElement("div");
        dialog.className = useBigDialog ? "prompt-big-dialog" : "prompt-dialog";

        if (!useBigDialog) {
            dialog.style.width = "100%";
            dialog.style.maxWidth = "500px";
        }

        const toolbar = document.createElement("div");
        toolbar.className = "toolbar";

        const leftDiv = document.createElement("div");
        leftDiv.className = "toolbar-left";
        leftDiv.innerHTML = toolbarLeft || "";

        const centerDiv = document.createElement("div");
        centerDiv.className = "toolbar-center";
        centerDiv.innerHTML = toolbarCenter || "";

        const rightDiv = document.createElement("div");
        rightDiv.className = "toolbar-right";
        rightDiv.innerHTML = toolbarRight || "";

        let closeButton = null;
        if (showCloseButton) {
            closeButton = document.createElement("button");
            closeButton.textContent = "close";
            closeButton.className = "icon-button dialog-window-control";
            closeButton.setAttribute("translate", "no");
        }

        toolbar.appendChild(leftDiv);
        toolbar.appendChild(centerDiv);
        toolbar.appendChild(rightDiv);

        if (showCloseButton) {
            rightDiv.appendChild(closeButton);
        }

        const content = document.createElement("div");
        content.className = "prompt-content";
        content.innerHTML = htmlContent || "";

        const scripts = content.querySelectorAll("script");
        scripts.forEach((oldScript) => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach((attr) =>
                newScript.setAttribute(attr.name, attr.value)
            );
            if (oldScript.src) {
                newScript.src = oldScript.src;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            oldScript.replaceWith(newScript);
        });

        dialog.appendChild(toolbar);
        dialog.appendChild(content);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        function cleanup() {
            try { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); } catch (e) { }
            overlay.removeEventListener("keydown", onKeyDown);
            if (closeButton) closeButton.removeEventListener("click", onCloseClick);
        }

        function onCloseClick() {
            cleanup();
            resolve();
        }

        function onKeyDown(event) {
            if (event.key === "Escape" || event.key === "Enter") {
                cleanup();
                resolve();
            }
        }

        if (closeButton) {
            closeButton.addEventListener("click", onCloseClick);
            closeButton.focus();
        } else {
            overlay.focus();
        }

        overlay.addEventListener("keydown", onKeyDown);
        I18n.applyWithin(overlay);
    });
}

function showMessageFromFile(filePath, showCloseButton = true, useBigDialog = false, showAnimation = true, showBg = true, width = 400, toolbarLeft = "", toolbarCenter = "", toolbarRight = "") {
    fetch(filePath).then((response) => {
        if (!response.ok) {
            throw new Error(`Failed loading file: ${response.statusText}`);
        }
        return response.text();
    }).then((htmlContent) => {
        const overlay = document.createElement("div");
        overlay.className = "prompt-overlay";
        if (!showBg) {
            overlay.classList.add("no-bg");
        }
        const dialog = document.createElement("div");
        dialog.className = useBigDialog ? "prompt-big-dialog" : "prompt-dialog";
        if (!useBigDialog) dialog.style.maxWidth = `${width}px`;
        if (!showAnimation) dialog.classList.add("no-animation");

        const closeButton = document.createElement("button");
        closeButton.textContent = "close";
        closeButton.className = "icon-button dialog-window-control";
        closeButton.setAttribute("translate", "no");

        const toolbar = document.createElement("div");
        toolbar.className = "toolbar";

        const toolbarLeftDiv = document.createElement("div");
        toolbarLeftDiv.className = "toolbar-left";
        toolbarLeftDiv.innerHTML = toolbarLeft;

        const toolbarCenterDiv = document.createElement("div");
        toolbarCenterDiv.className = "toolbar-center";
        toolbarCenterDiv.innerHTML = toolbarCenter;

        const toolbarRightDiv = document.createElement("div");
        toolbarRightDiv.className = "toolbar-right";
        toolbarRightDiv.innerHTML = toolbarRight;

        if (showCloseButton) toolbarRightDiv.appendChild(closeButton);

        toolbar.appendChild(toolbarLeftDiv);
        toolbar.appendChild(toolbarCenterDiv);
        toolbar.appendChild(toolbarRightDiv);

        const content = document.createElement("div");
        const template = document.createElement("template");
        template.innerHTML = htmlContent.trim();
        Array.from(template.content.childNodes).forEach((node) => content.appendChild(node));

        dialog.appendChild(toolbar);
        dialog.appendChild(content);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        translateWithin(overlay);

        const scripts = content.querySelectorAll("script");
        scripts.forEach((oldScript) => {
            const newScript = document.createElement("script");
            if (oldScript.src) {
                newScript.src = oldScript.src;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            Array.from(oldScript.attributes).forEach((attr) =>
                newScript.setAttribute(attr.name, attr.value)
            );
            oldScript.replaceWith(newScript);
        });

        closeButton.addEventListener("click", () => {
            document.body.removeChild(overlay);
        });

        overlay.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                document.body.removeChild(overlay);
            }
        });

        closeButton.focus();
    })
        .catch((error) => {
            console.error(error);
        });
}

function promptConfirm(message, dangerous = false) {
    return new Promise((resolve) => {
        // overlay
        const overlay = document.createElement("div");
        overlay.className = "prompt-overlay";

        // dialog
        const dialog = document.createElement("div");
        dialog.className = "prompt-dialog";
        dialog.style.padding = "20px";
        dialog.style.width = "100%";
        dialog.style.maxWidth = "400px";

        // message
        const text = document.createElement("p");
        text.textContent = message;
        text.className = "prompt-title";
        dialog.appendChild(text);

        // buttons
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "prompt-buttons";

        const yesButton = document.createElement("button");
        yesButton.textContent = "Yes";
        yesButton.dataset.locale = "generic.yes";
        if (dangerous) {
            yesButton.className = "prompt-button danger";
        } else {
            yesButton.className = "prompt-button submit";
        }

        const noButton = document.createElement("button");
        noButton.textContent = "No";
        noButton.dataset.locale = "generic.no";
        noButton.className = "prompt-button cancel";

        buttonContainer.appendChild(noButton);
        buttonContainer.appendChild(yesButton);
        translateWithin(buttonContainer);
        dialog.appendChild(buttonContainer);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        function closePrompt(result) {
            document.body.removeChild(overlay);
            resolve(result);
        }

        yesButton.addEventListener("click", () => closePrompt(true));
        noButton.addEventListener("click", () => closePrompt(false));

        overlay.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closePrompt(false);
            }
        });

        if (!dangerous) yesButton.focus();
        else noButton.focus();
    });
}

function promptSelect(title, options) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "prompt-overlay";

        const dialog = document.createElement("div");
        dialog.className = "prompt-dialog";
        dialog.style.maxWidth = "600px";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "prompt-search-input";
        input.placeholder = title;

        const list = document.createElement("ul");
        list.className = "prompt-preview-list";

        dialog.append(input, list);

        const toolbar = document.createElement("div");
        toolbar.className = "toolbar";
        toolbar.style.marginTop = "2px";

        const left = document.createElement("div");
        left.className = "toolbar-left";

        const center = document.createElement("div");
        center.className = "toolbar-center";

        const right = document.createElement("div");
        right.className = "toolbar-right";

        const closeButton = document.createElement("button");
        closeButton.textContent = "close";
        closeButton.className =
            "icon-button dialog-window-control transparent-dialog-window-control";
        closeButton.setAttribute("translate", "no");

        closeButton.addEventListener("click", () => close(null));

        toolbar.append(left, center, right);
        right.appendChild(closeButton);

        dialog.appendChild(toolbar);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        let filtered = [];
        let selectedIndex = 0;

        function normalizeOption(opt) {
            if (typeof opt === "string") {
                return {
                    title: opt,
                    description: ""
                };
            }
            return opt;
        }

        const normalized = options.map(normalizeOption);

        function close(result) {
            if (overlay.parentNode) overlay.remove();
            resolve(result);
        }

        function update() {
            const q = input.value.toLowerCase();

            filtered = normalized.filter(o =>
                o.title.toLowerCase().includes(q)
            );

            list.innerHTML = "";

            filtered.forEach((item, i) => {
                const li = document.createElement("li");
                li.className = "prompt-item";
                if (i === selectedIndex) li.classList.add("selected-option");

                const icon = document.createElement("span");
                icon.className = "icon";
                icon.textContent = item.icon || "";
                icon.style.color = item.color;
                icon.classList.add("color-" + item.color);

                const textWrap = document.createElement("div");
                textWrap.className = "prompt-item-text";

                const titleEl = document.createElement("div");
                titleEl.className = "prompt-item-title";
                titleEl.textContent = item.title;

                textWrap.appendChild(titleEl);

                if (item.description) {
                    const desc = document.createElement("div");
                    desc.className = "prompt-item-description";
                    desc.innerHTML = item.description;
                    textWrap.appendChild(desc);
                }

                li.append(icon, textWrap);

                li.addEventListener("click", () =>
                    close(normalized.indexOf(item))
                );

                list.appendChild(li);
            });
        }

        input.addEventListener("input", () => {
            selectedIndex = 0;
            update();
        });

        overlay.addEventListener("keydown", (e) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                selectedIndex = Math.min(
                    selectedIndex + 1,
                    filtered.length - 1
                );
                update();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                update();
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (filtered[selectedIndex]) {
                    close(normalized.indexOf(filtered[selectedIndex]));
                }
            } else if (e.key === "Escape") {
                close(null);
            }
        });

        overlay.tabIndex = -1;
        overlay.focus();
        input.focus();

        update();
    });
}

function promptCodeEditor(initialText = "") {
    return new Promise((resolve) => {
        // overlay
        const overlay = document.createElement("div");
        overlay.className = "prompt-overlay";

        // dialog
        const dialog = document.createElement("div");
        dialog.className = "prompt-dialog";
        dialog.style.display = "flex";
        dialog.style.flexDirection = "column";
        dialog.style.maxWidth = "80%";

        // toolbar
        const toolbar = document.createElement("div");
        toolbar.className = "toolbar";

        const leftDiv = document.createElement("div");
        leftDiv.className = "toolbar-left";

        const centerDiv = document.createElement("div");
        centerDiv.className = "toolbar-center";

        const rightDiv = document.createElement("div");
        rightDiv.className = "toolbar-right";

        const undoButton = document.createElement("button");
        undoButton.textContent = "undo";
        undoButton.className = "icon-button";
        undoButton.title = "Un-do";
        undoButton.setAttribute("translate", "no");

        const redoButton = document.createElement("button");
        redoButton.textContent = "redo";
        redoButton.className = "icon-button";
        redoButton.title = "Re-do";
        redoButton.setAttribute("translate", "no");

        const okButton = document.createElement("button");
        okButton.textContent = "check";
        okButton.className = "icon-button";
        okButton.title = "Confirm";
        okButton.setAttribute("translate", "no");

        const closeButton = document.createElement("button");
        closeButton.textContent = "close";
        closeButton.className = "icon-button dialog-window-control";
        closeButton.setAttribute("translate", "no");

        leftDiv.appendChild(undoButton);
        leftDiv.appendChild(redoButton);

        rightDiv.appendChild(okButton);
        rightDiv.appendChild(closeButton);

        toolbar.appendChild(leftDiv);
        toolbar.appendChild(centerDiv);
        toolbar.appendChild(rightDiv);

        // textarea container
        const editorContainer = document.createElement("div");
        editorContainer.style.display = "flex";
        editorContainer.style.flex = "1";
        editorContainer.style.padding = "0";
        editorContainer.style.margin = "0";

        const textarea = document.createElement("textarea");
        textarea.value = initialText;
        textarea.style.flex = "1";
        textarea.className = "prompt-text-editor";
        textarea.setAttribute("spellcheck", "false");

        editorContainer.appendChild(textarea);
        
        dialog.appendChild(toolbar);
        dialog.appendChild(editorContainer);
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        textarea.focus();

        requestAnimationFrame(() => {
            textarea.selectionStart = 0;
            textarea.selectionEnd = 0;
            textarea.scrollTop = 0;
        });

        // helpers
        function closePrompt(result) {
            document.body.removeChild(overlay);
            resolve(result);
        }

        okButton.addEventListener("click", () => closePrompt(textarea.value));
        closeButton.addEventListener("click", () => closePrompt(null));

        undoButton.addEventListener("click", () => {
            textarea.focus();
            document.execCommand("undo");
        });

        redoButton.addEventListener("click", () => {
            textarea.focus();
            document.execCommand("redo");
        });

        textarea.addEventListener("keydown", (event) => {
            if (event.key === "Tab") {
                event.preventDefault();

                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;

                const value = textarea.value;
                const lines = value.split("\n");

                const startLine = value.substring(0, start).split("\n").length - 1;
                const endLine = value.substring(0, end).split("\n").length - 1;

                if (!event.shiftKey) {
                    for (let i = startLine; i <= endLine; i++) {
                        lines[i] = "\t" + lines[i];
                    }
                } else {
                    for (let i = startLine; i <= endLine; i++) {
                        if (lines[i].startsWith("\t")) {
                            lines[i] = lines[i].substring(1);
                        }
                    }
                }

                const newValue = lines.join("\n");

                let diff = 0;

                if (!event.shiftKey) {
                    diff = 1;
                } else {
                    const originalLines = value.split("\n");
                    if (originalLines[startLine].startsWith("\t")) diff = -1;
                }

                textarea.value = newValue;

                textarea.selectionStart = start + diff;
                textarea.selectionEnd = end + diff * (endLine - startLine + 1);
            }
        });

        overlay.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                closePrompt(textarea.value);
            }
        });
    });
}

function showBanner({ message = "", buttons = [], menuButtons = [] }) {
    // Remove existing banners
    document.querySelectorAll('.prompt-banner').forEach(b => b.remove());

    // Creates the banner container
    const banner = document.createElement('div');
    banner.className = 'prompt-banner';

    /**
     * Closes the banner
     */
    function closeBanner() {
        banner.remove();
    }

    // Left side (message)
    const leftContent = document.createElement('div');
    leftContent.className = 'prompt-banner-left';
    leftContent.innerHTML = message;
    banner.appendChild(leftContent);

    // Right side (actions)
    const rightContent = document.createElement('div');
    rightContent.className = 'prompt-banner-right';

    // create buttons (right side)
    buttons.forEach(btnInfo => {
        const btn = document.createElement('button');
        btn.innerHTML = btnInfo.value;
        btn.className = 'prompt-text-button';
        if (btnInfo.isPrimary) btn.classList.add('prompt-primary');
        if (btnInfo.isIcon) btn.classList.add('icon-button');

        // allows button action to close the banner
        btn.addEventListener('mouseup', () => btnInfo.onclick?.(closeBanner));
        rightContent.appendChild(btn);
    });

    // create menu (right side)
    if (menuButtons.length > 0) {
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';

        const menuButton = document.createElement('button');
        menuButton.className = 'icon-button';
        menuButton.innerHTML = 'more_vert';
        menuButton.title = 'More options';
        menuButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('show');
        });
        dropdown.appendChild(menuButton);

        const menuContent = document.createElement('div');
        menuContent.className = 'dropdown-content menu';

        menuButtons.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'text-button';
            btn.innerHTML = item.value;
            btn.addEventListener('mouseup', () => {
                item.onclick?.(closeBanner);
                dropdown.classList.remove('show');
            });
            menuContent.appendChild(btn);
        });

        dropdown.appendChild(menuContent);
        rightContent.appendChild(dropdown);
    }

    banner.appendChild(rightContent);
    document.body.appendChild(banner);
}

function promptColorInfo(colorString, schemeType = "none") {
    return new Promise((resolve) => {
        function parseCssColorToRGBA(input) {
            // create an offscreen element to get computed color
            const el = document.createElement("div");
            el.style.color = input;
            el.style.position = "absolute";
            el.style.left = "-9999px";
            document.body.appendChild(el);
            const cs = getComputedStyle(el).color;
            document.body.removeChild(el);

            const m = cs.match(/rgba?\(([\d.\s]+),\s*([\d.\s]+),\s*([\d.\s]+)(?:,\s*([\d.\s]+))?\)/);
            if (!m) return null;
            return {
                r: Math.round(Number(m[1])),
                g: Math.round(Number(m[2])),
                b: Math.round(Number(m[3])),
                a: m[4] !== undefined ? Number(m[4]) : 1
            };
        }

        function toHex({ r, g, b, a }) {
            const h = (v) => v.toString(16).padStart(2, "0");
            if (a < 1) {
                const aa = Math.round(a * 255);
                return `#${h(r)}${h(g)}${h(b)}${h(aa)}`.toLowerCase();
            }
            return `#${h(r)}${h(g)}${h(b)}`.toLowerCase();
        }

        function toRgbString({ r, g, b, a }) {
            return a < 1 ? `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})` : `rgb(${r}, ${g}, ${b})`;
        }

        function rgbToHsv({ r, g, b }) {
            const rn = r / 255, gn = g / 255, bn = b / 255;
            const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
            const d = max - min;
            let h = 0;
            if (d !== 0) {
                if (max === rn) h = ((gn - bn) / d) % 6;
                else if (max === gn) h = (bn - rn) / d + 2;
                else h = (rn - gn) / d + 4;
                h = Math.round(h * 60);
                if (h < 0) h += 360;
            }
            const s = max === 0 ? 0 : +(d / max * 100).toFixed(1);
            const v = +(max * 100).toFixed(1);
            return { h, s, v };
        }

        function rgbToHsvString(rgb) {
            const { h, s, v } = rgbToHsv(rgb);
            return `hsv(${h}, ${s}%, ${v}%)`;
        }

        function rgbToHsl({ r, g, b }) {
            const rn = r / 255, gn = g / 255, bn = b / 255;
            const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
            const d = max - min;
            const l = (max + min) / 2;
            let h = 0, s = 0;
            
            if (d !== 0) {
                if (max === rn) h = ((gn - bn) / d) % 6;
                else if (max === gn) h = (bn - rn) / d + 2;
                else h = (rn - gn) / d + 4;
                h = Math.round(h * 60);
                if (h < 0) h += 360;
                s = +(d / (1 - Math.abs(2 * l - 1)) * 100).toFixed(1);
            }
            
            return { h, s, l: +(l * 100).toFixed(1) };
        }

        function rgbToHslString(rgb) {
            const { h, s, l } = rgbToHsl(rgb);
            return `hsl(${h}, ${s}%, ${l}%)`;
        }

        // Oklab conversion
        function srgbToLinear(c) {
            c = c / 255;
            return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        }

        function linearToOklab(r, g, b) {
            // linear r,g,b -> XYZ
            const X = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
            const Y = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
            const Z = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

            // XYZ -> LMS
            const l_ = 0.8189330101 * X + 0.3618667424 * Y - 0.1288597137 * Z;
            const m_ = 0.0329845436 * X + 0.9293118715 * Y + 0.0361456387 * Z;
            const s_ = 0.0482003018 * X + 0.2643662691 * Y + 0.6338517070 * Z;

            const l = Math.cbrt(l_);
            const m = Math.cbrt(m_);
            const s = Math.cbrt(s_);

            const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
            const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
            const b_ = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

            return { L, a, b: b_ };
        }

        function rgbToOklabString({ r, g, b }) {
            const lr = srgbToLinear(r);
            const lg = srgbToLinear(g);
            const lb = srgbToLinear(b);

            const { L, a, b: bb } = linearToOklab(lr, lg, lb);

            const Lcss = +(L * 100).toFixed(4);
            return `oklab(${Lcss}%, ${a.toFixed(4)}, ${bb.toFixed(4)})`;
        }

        function hsvToRgb({ h, s, v }) {
            // Normalize s and v from 0-100 to 0-1
            const sat = s / 100;
            const val = v / 100;
            
            const c = val * sat;
            const hp = h / 60;
            const x = c * (1 - Math.abs(hp % 2 - 1));
            let r = 0, g = 0, b = 0;
            
            if (hp >= 0 && hp < 1) { r = c; g = x; b = 0; }
            else if (hp >= 1 && hp < 2) { r = x; g = c; b = 0; }
            else if (hp >= 2 && hp < 3) { r = 0; g = c; b = x; }
            else if (hp >= 3 && hp < 4) { r = 0; g = x; b = c; }
            else if (hp >= 4 && hp < 5) { r = x; g = 0; b = c; }
            else if (hp >= 5 && hp < 6) { r = c; g = 0; b = x; }
            
            const m = val - c;
            return {
                r: Math.round((r + m) * 255),
                g: Math.round((g + m) * 255),
                b: Math.round((b + m) * 255),
                a: 1
            };
        }

        function getColorScheme(rgba, scheme) {
            const hsv = rgbToHsv(rgba);
            const colors = [rgba]; // include the original color
            
            switch (scheme) {
                case "complementary":
                    colors.push(hsvToRgb({ h: (hsv.h + 180) % 360, s: hsv.s, v: hsv.v }));
                    break;
                case "monochromatic":
                    colors.push(hsvToRgb({ h: hsv.h, s: hsv.s, v: Math.max(0, hsv.v - 30) }));
                    colors.push(hsvToRgb({ h: hsv.h, s: hsv.s, v: Math.min(100, hsv.v + 30) }));
                    break;
                case "analogous":
                    colors.push(hsvToRgb({ h: (hsv.h + 30) % 360, s: hsv.s, v: hsv.v }));
                    colors.push(hsvToRgb({ h: (hsv.h - 30 + 360) % 360, s: hsv.s, v: hsv.v }));
                    break;
                case "triadic":
                    colors.push(hsvToRgb({ h: (hsv.h + 120) % 360, s: hsv.s, v: hsv.v }));
                    colors.push(hsvToRgb({ h: (hsv.h + 240) % 360, s: hsv.s, v: hsv.v }));
                    break;
                case "tetradic":
                    colors.push(hsvToRgb({ h: (hsv.h + 90) % 360, s: hsv.s, v: hsv.v }));
                    colors.push(hsvToRgb({ h: (hsv.h + 180) % 360, s: hsv.s, v: hsv.v }));
                    colors.push(hsvToRgb({ h: (hsv.h + 270) % 360, s: hsv.s, v: hsv.v }));
                    break;
            }
            
            return colors;
        }

        function createRow(label, value, aboutColor) {
            const row = document.createElement("div");
            row.className = "color-info-row";

            const lbl = document.createElement("div");
            lbl.className = "color-info-label";
            lbl.title = aboutColor;
            lbl.textContent = label;

            const val = document.createElement("input");
            val.style.marginBottom = "0";
            val.style.fontFamily = "monospace";
            val.value = value;
            val.readOnly = true;

            const copyBtn = document.createElement("button");
            copyBtn.className = "icon-button";
            copyBtn.textContent = "content_copy";
            copyBtn.title = "Copy to clipboard";
            copyBtn.translate = "no";
            copyBtn.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(val.value);
                    showToast("Copied", "check");
                } catch (e) {
                    // fallback select
                    val.select();
                    document.execCommand && document.execCommand("copy");
                    showToast("Copied", "check");
                }
            });

            row.appendChild(lbl);
            row.appendChild(val);
            row.appendChild(copyBtn);
            return row;
        }

        function createColorSchemeGrid(colors, scheme, targetContainer) {
            colors.forEach((color, index) => {
                const colorBox = document.createElement("div");
                colorBox.className = "color-scheme-box";
                colorBox.style.backgroundColor = toHex(color);
                colorBox.title = toHex(color);
                
                colorBox.addEventListener("click", (e) => {
                    e.stopPropagation();
                    closeAllDialogs();
                    promptColorInfo(toHex(color), scheme);
                });
                
                targetContainer.appendChild(colorBox);
            });
        }

        // build dialog
        const rgba = parseCssColorToRGBA(colorString) || { r: 0, g: 0, b: 0, a: 1 };
        const hex = toHex(rgba);
        const rgbStr = toRgbString(rgba);
        const hsvStr = rgbToHsvString(rgba);
        const hslStr = rgbToHslString(rgba);
        const oklabStr = rgbToOklabString(rgba);

        const overlay = document.createElement("div");
        overlay.className = "prompt-overlay";

        const dialog = document.createElement("div");
        dialog.className = "prompt-dialog color-preview-dialog";
        dialog.style.maxWidth = "420px";

        const toolbar = document.createElement("div");
        toolbar.className = "toolbar";
        const left = document.createElement("div"); left.className = "toolbar-left";
        const center = document.createElement("div"); center.className = "toolbar-center";
        const right = document.createElement("div"); right.className = "toolbar-right";
        
        // Hidden select for scheme value tracking
        const schemeSelect = document.createElement("select");
        schemeSelect.style.display = "none";
        schemeSelect.innerHTML = `
            <option value="none">None</option>
            <option value="complementary">Complementary</option>
            <option value="monochromatic">Monochromatic</option>
            <option value="analogous">Analogous</option>
            <option value="triadic">Triadic</option>
            <option value="tetradic">Tetradic</option>
        `;
        schemeSelect.value = schemeType;
        
        // Scheme dropdown menu
        const dropdown = document.createElement("div");
        dropdown.className = "dropdown";
        
        const menuButton = document.createElement("button");
        menuButton.className = "icon-button";
        menuButton.setAttribute("translate", "no");
        menuButton.title = "Color scheme";
        menuButton.textContent = "more_vert";
        
        const dropdownMenuId = "color-scheme-menu-" + Math.random().toString(36).substr(2, 9);
        
        const dropdownContent = document.createElement("div");
        dropdownContent.className = "dropdown-content menu align-left";
        dropdownContent.id = dropdownMenuId;
        dropdownContent.style.minWidth = "150px";
        
        // Scheme options
        const schemes = [
            { value: "none", label: "None" },
            { value: "complementary", label: "Complementary" },
            { value: "monochromatic", label: "Monochromatic" },
            { value: "analogous", label: "Analogous" },
            { value: "triadic", label: "Triadic" },
            { value: "tetradic", label: "Tetradic" }
        ];
        
        schemes.forEach((scheme, index) => {
            const btn = document.createElement("button");
            btn.className = "text-button";
            btn.textContent = scheme.label;
            
            if (schemeType === scheme.value) {
                btn.style.backgroundColor = "var(--hover-color)";
            }
            
            btn.addEventListener("mouseup", () => {
                schemeSelect.value = scheme.value;
                updateScheme();
                
                // Update button styling
                dropdownContent.querySelectorAll("button").forEach(b => {
                    b.style.backgroundColor = "";
                });
                btn.style.backgroundColor = "var(--hover-color)";
                
                dropdown.classList.remove("show");
                hideAllMenus();
            });
            
            dropdownContent.appendChild(btn);
        });
        
        menuButton.addEventListener("mousedown", (e) => {
            e.preventDefault();
            toggleDropdown(dropdownMenuId);
        });
        
        dropdown.appendChild(menuButton);
        dropdown.appendChild(dropdownContent);
        left.appendChild(dropdown);
        
        const closeButton = document.createElement("button");
        closeButton.textContent = "close";
        closeButton.className = "icon-button dialog-window-control";
        closeButton.setAttribute("translate", "no");
        right.appendChild(closeButton);
        toolbar.appendChild(left); toolbar.appendChild(center); toolbar.appendChild(right);

        const preview = document.createElement("div");
        preview.className = "color-info-preview";
        preview.style.background = colorString;

        // Scheme colors container
        const schemeColorsContainer = document.createElement("div");
        schemeColorsContainer.id = "color-scheme-colors";

        const inputList = document.createElement("div");
        inputList.className = "color-info-list";

        inputList.appendChild(createRow("Hex", hex, "Hexadecimal color representation"));
        inputList.appendChild(createRow("RGB", rgbStr, "Red, Green, Blue (and Alpha) color model"));
        inputList.appendChild(createRow("HSL", hslStr, "Hue, Saturation, Lightness color model"));
        inputList.appendChild(createRow("HSV", hsvStr, "Hue, Saturation, Value color model"));
        inputList.appendChild(createRow("OKLab", oklabStr, "Perceptually uniform color space"));

        // Scheme colors container (used for menu)
        const schemeContainer = document.createElement("div");
        schemeContainer.id = "color-scheme-container";

        function updateScheme() {
            schemeColorsContainer.innerHTML = "";
            if (schemeSelect.value !== "none") {
                const schemeColors = getColorScheme(rgba, schemeSelect.value);
                createColorSchemeGrid(schemeColors, schemeSelect.value, schemeColorsContainer);
            }
        }

        updateScheme();
        schemeSelect.addEventListener("change", updateScheme);

        dialog.appendChild(toolbar);
        dialog.appendChild(preview);
        dialog.appendChild(schemeColorsContainer);
        dialog.appendChild(inputList);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        function cleanup() {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            resolve();
        }

        closeButton.addEventListener("click", cleanup);
        overlay.addEventListener("keydown", (e) => {
            if (e.key === "Escape") cleanup();
        });

        // focus first input
        const firstInput = inputList.querySelector("input");
        if (firstInput) firstInput.focus();
    });
}

function showVRMMeta(vrm) {
    if (!vrm || !vrm.meta) {
        return Promise.resolve();
    }
    const meta = vrm.meta;
    const table = document.createElement('table');
    table.style.width = '100%';

    const addItem = (label, value, dataLocale) => {
        const tr = document.createElement('tr');
        const tdLabel = document.createElement('td');
        tdLabel.style.fontWeight = 'bold';
        tdLabel.style.borderBottom = '1px solid var(--border-light-color)';
        tdLabel.style.padding = '6px 8px';
        tdLabel.textContent = label;
        tdLabel.title = label;
        tdLabel.dataset.locale = dataLocale;
        const tdValue = document.createElement('td');
        tdValue.style.borderBottom = '1px solid var(--border-light-color)';
        tdValue.style.padding = '6px 8px';
        tdValue.textContent = (value !== undefined && value !== null && value !== '') ? value : 'N/A';
        tr.appendChild(tdLabel);
        tr.appendChild(tdValue);
        table.appendChild(tr);
    };

    const addSubTitle = (title, dataLocale) => {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 2;
        td.style.textAlign = 'center';
        td.textContent = title;
        td.dataset.locale = dataLocale;
        tr.appendChild(td);
        table.appendChild(tr);
    }

    // determine VRM meta version safely
    const metaVersion = meta.metaVersion;

    if (metaVersion == '0') {
        // VRM 0.x
        addSubTitle('Avatar information', 'dialogs.model-info.vrm0.avatar-information');
        addItem('Title', meta.title || 'N/A', 'dialogs.model-info.vrm0.avatar-information.title');
        addItem('Creator', meta.author || 'N/A', 'dialogs.model-info.vrm0.avatar-information.creator');
        addItem('Contact Information', meta.contactInformation || 'N/A', 'dialogs.model-info.vrm0.avatar-information.contact-information');
        addItem('Reference', meta.reference || 'N/A', 'dialogs.model-info.vrm0.avatar-information.reference');
        addItem('Version', meta.version || 'N/A', 'dialogs.model-info.vrm0.avatar-information.version');
        addItem('VRM version', meta.metaVersion || 'N/A', "dialogs.model-info.vrm0.avatar-information.vrm-version");
        
        addSubTitle('Avatar personality','dialogs.model-info.vrm0.avatar-personality');
        addItem('Allowed User Name', meta.allowedUserName || 'N/A', 'dialogs.model-info.vrm0.avatar-personality.allowed-user-name');
        addItem('Depictions of violence', meta.violentUssageName || 'No', 'dialogs.model-info.vrm0.avatar-personality.depictions-of-violence');
        addItem('Depictions of sexual acts', meta.sexualUssageName || 'No', 'dialogs.model-info.vrm0.avatar-personality.depictions-of-sexual-acts');
        addItem('Commercial use', meta.commercialUssageName || 'No', 'dialogs.model-info.vrm0.avatar-personality.commercial-use');
        addItem('Permission information URL', meta.otherPermissionUrl || 'N/A', 'dialogs.model-info.vrm0.avatar-personality.permission-information-url');

        addSubTitle('Redistribution and alteration','dialogs.model-info.vrm0.redistribution-and-alteration');
        addItem('License', meta.licenseName || 'N/A', 'dialogs.model-info.vrm0.redistribution-and-alteration.license');
    } else if (metaVersion == '1') {
        // VRM 1.x
        addSubTitle('Avatar information', 'dialogs.model-info.vrm1.avatar-information');
        addItem('Avatar name', meta.name || 'N/A', 'dialogs.model-info.vrm1.avatar-information.avatar-name');
        addItem('Version', meta.version || 'N/A', 'dialogs.model-info.vrm1.avatar-information.version');
        addItem('Authors', (meta.authors && meta.authors.length > 0) ? meta.authors.join(', ') : 'N/A', 'dialogs.model-info.vrm1.avatar-information.authors');
        addItem('Creator copyright', meta.copyrightInformation || 'N/A', 'dialogs.model-info.vrm1.avatar-information.creator-copyright');
        addItem('Contact Information', meta.contactInformation || 'N/A', 'dialogs.model-info.vrm1.avatar-information.contact-information');
        addItem('References', (meta.references && meta.references.length > 0) ? meta.references.join(', ') : 'N/A', 'dialogs.model-info.vrm1.avatar-information.references');
        addItem('Third party licenses', meta.thirdPartyLicenses || 'N/A', 'dialogs.model-info.vrm1.avatar-information.third-party-licenses');

        addSubTitle('Avatar permission', 'dialogs.model-info.vrm1.avatar-permission');
        addItem('Avatar use permission', meta.avatarPermission || 'N/A', 'dialogs.model-info.vrm1.avatar-permission.avatar-use-permission');
        addItem('Violent usage', meta.allowExcessivelyViolentUsage ? 'Yes' : 'No', 'dialogs.model-info.vrm1.avatar-permission.violent-usage');
        addItem('Sexual usage', meta.allowExcessivelySexualUsage ? 'Yes' : 'No', 'dialogs.model-info.vrm1.avatar-permission.sexual-usage');
        addItem('Political usage', meta.allowPoliticalOrReligiousUsage ? 'Yes' : 'No', 'dialogs.model-info.vrm1.avatar-permission.political-usage');
        addItem('Antisocial usage', meta.allowAntisocialOrHateUsage ? 'Yes' : 'No', 'dialogs.model-info.vrm1.avatar-permission.antisocial-usage');
        addItem('Commercial usage', meta.commercialUsage || 'No', 'dialogs.model-info.vrm1.avatar-permission.commercial-usage');

        addSubTitle('Redistribution and alteration', 'dialogs.model-info.vrm1.redistribution-and-alteration');
        addItem('Redistribution', meta.allowRedistribution ? 'Yes' : 'No', 'dialogs.model-info.vrm1.redistribution-and-alteration.redistribution');
        addItem('Alterations', meta.modification || 'N/A', 'dialogs.model-info.vrm1.redistribution-and-alteration.alterations');
        addItem('Attribution', meta.creditNotation || 'N/A', 'dialogs.model-info.vrm1.redistribution-and-alteration.attribution');
    } else {
        // Unknown version
        addItem('VRM version', 'Unknown', 'dialogs.model-info.vrm-unknown.version');
    }

    promptMessage(table.outerHTML, true, false);
}