//Imports
import "./lib/polyfill.js";
import "./lib/utils.js";
import algo from "./algo.js";


// Fetch config.json
const config = await (await fetch("./config.json")).json();

const optionsDefaults = {}
for (let [key, value] of Object.entries(config.options)) {
    optionsDefaults[key] = value.default;
}
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
            console.log(options[option]);
            //Number
            if (optionsConfig[option].type === "number")
                options[option] = Number(options[option]);
            console.log(options[option]);


        }

        console.log(options);
        //Hide form
        form.style.display = "none";
        //Start timer
        //Run algorithm
        console.log(await algo(options));
        form.style.display = "";
        //Stop timer


    }
    for (let [key, value] of Object.entries(optionsConfig)) {
        let inputEl;
        const label = document.createElement("label");
        label.innerText = value.label;
        label.htmlFor = key;
        switch (value.type) {
            case "select":
                inputEl = document.createElement("select");
                inputEl.id = key;
                inputEl.value = value.default;
                inputEl.name = key;
                for (let option of value.options) {
                    const optionElement = document.createElement("option");
                    optionElement.value = option.value;
                    optionElement.innerText = option.label;
                    inputEl.appendChild(optionElement);
                }
                break;
            case "number":
                inputEl = document.createElement("input");
                inputEl.type = "number";
                inputEl.id = key;
                inputEl.value = value.default;
                inputEl.name = key;
                break;
            case "checkbox":
                inputEl = document.createElement("input");
                inputEl.type = "checkbox";
                inputEl.id = key;
                inputEl.checked = value.default;
                inputEl.name = key;
                break;
        }

        form.appendChild(label);
        form.appendChild(inputEl);
    }
    //Create submit button
    const submitButton = document.createElement("button");
    submitButton.innerText = "Submit";
    submitButton.type = "submit";
    form.appendChild(submitButton);
    //Append to body
    document.body.appendChild(form);
}

createForm(config.options);




