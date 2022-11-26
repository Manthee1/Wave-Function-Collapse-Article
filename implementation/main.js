//Imports
import "./lib/polyfill.js";
import "./lib/utils.js";
import algo from "./algo.js";


// Fetch config.json
const config = await (await fetch("./config.json")).json();

const optionsDefaults = {}
for (let [key, value] of Object.entries(config.options)) optionsDefaults[key] = value.default;

console.log(optionsDefaults);
//Create form based on options object

function createForm(optionsConfig) {
    //Remove old form
    document.querySelector("form")?.remove();

    const form = document.createElement("form");
    form.id = "options-form";
    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        let options = Object.fromEntries(formData.entries());
        options = Object.assign(optionsDefaults, options);
        //Convert string values to correct type
        for (let option of Object.keys(options)) {
            //Checkbox
            if (optionsConfig[option].type === "checkbox")
                options[option] = options[option] === "on";
            //Number
            if (optionsConfig[option].type === "number")
                options[option] = Number(options[option]);


        }

        form.style.opacity = 0;
        form.style.scale = 1.5;

        await sleep(500)

        //Hide form
        form.style.display = "none";
        //Start timer
        //Run algorithm
        console.log(await algo(options));
        form.style.display = "";
        await sleep(100)

        form.style.opacity = "";
        form.style.scale = "";
        //Stop timer


    }

    //Form title
    const title = document.createElement("h2");
    title.innerText = "Options";
    title.className = "title";
    form.appendChild(title);

    //Create form input container
    const formContainer = document.createElement("div");
    formContainer.id = "form-container";
    form.appendChild(formContainer);


    for (let [key, value] of Object.entries(optionsConfig)) {
        let inputEl;
        const container = document.createElement("div");
        container.classList.add("form-item");
        const label = document.createElement("label");
        label.innerText = value.label;
        label.htmlFor = key;
        switch (value.type) {
            case "select":
                inputEl = document.createElement("select");
                inputEl.id = key;
                inputEl.name = key;
                for (let option of value.options) {
                    const optionElement = document.createElement("option");
                    optionElement.value = option.value;
                    optionElement.innerText = option.label;
                    inputEl.appendChild(optionElement);
                }
                inputEl.value = value.default;
                break;
            case "number":
                inputEl = document.createElement("input");
                inputEl.type = "number";
                inputEl.id = key;
                inputEl.value = value.default;
                inputEl.name = key

                break;
            case "checkbox":
                inputEl = document.createElement("input");
                inputEl.type = "checkbox";
                inputEl.id = key;
                inputEl.checked = value.default;
                inputEl.name = key
                break;
            case "radio":
                inputEl = document.createElement("div");
                inputEl.id = key;
                inputEl.name = key;
                inputEl.classList.add("form-radio");
                container.classList.add("col");
                for (let option of value.options) {
                    const radioGroup = document.createElement("div");
                    radioGroup.classList.add("form-radio-group");
                    const radio = document.createElement("input");
                    radio.type = "radio";
                    radio.id = key + "-" + option.value;
                    radio.value = option.value;
                    radio.name = key;
                    radio.checked = option.value === value.default;
                    const radioLabel = document.createElement("label");
                    radioLabel.innerText = option.label;
                    radioLabel.htmlFor = key + "-" + option.value;
                    radioGroup.appendChild(radio);
                    radioGroup.appendChild(radioLabel);
                    inputEl.appendChild(radioGroup);
                }
                break;
        }
        container.appendChild(label);
        container.appendChild(inputEl);
        formContainer.appendChild(container);
    }

    //Button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "submit-button-container";
    form.appendChild(buttonContainer);

    //Create submit button
    const submitButton = document.createElement("button");
    submitButton.innerText = "Run Algorithm";
    submitButton.type = "submit";
    buttonContainer.appendChild(submitButton);
    //Append to body
    document.body.appendChild(form);
}

createForm(config.options);




