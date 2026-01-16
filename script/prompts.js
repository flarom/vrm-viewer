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

function promptOpenFile() {
    return new Promise((resolve) => {
        // overlay
        const overlay = document.createElement("div");
        overlay.className = "prompt-overlay";

        // dialog
        const dialog = document.createElement("div");
        dialog.className = "prompt-dialog";
        dialog.style.width = "100%";
        dialog.style.maxWidth = "600px";

        const dropArea = document.createElement("div");
        dropArea.className = "drop-area";

        const dropAreaText = document.createElement("div");
        dropAreaText.className = "drop-area-text";
        dropAreaText.innerHTML = `<p>Drag and drop a file here</p><p class="subtitle">Or select a file</p>`

        dropArea.appendChild(dropAreaText);
        dialog.appendChild(dropArea);

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

        dropArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropArea.classList.add("dragover");
        });

        dropArea.addEventListener("dragleave", () => {
            dropArea.classList.remove("dragover");
        });

        dropArea.addEventListener("drop", (e) => {
            e.preventDefault();
            dropArea.classList.remove("dragover");
            const file = e.dataTransfer.files[0];
            close(file);
        });

        dropArea.addEventListener("click", () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".vrm,.vrma"
            input.onchange = (event) => {
                close(event.target.files[0]);
            };
            input.click();
        });

        function close(result) {
            document.body.removeChild(overlay);
            resolve(result);
        }

        overlay.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                close(false);
            }
        });
    });
}