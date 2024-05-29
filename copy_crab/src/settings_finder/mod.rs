use std::fs;

use crate::models::ProjectChoices;

use anyhow::bail;
use colored::Colorize;
use serde_json::{Value, json};

const FILE_NAME: &'static str = "copy-paste.json";
const SETTINGS_KEY: &'static str = "crabSafe";

pub fn find_settings() -> anyhow::Result<Option<ProjectChoices>> {
    // Check if the file exists
    if let Err(_) = fs::metadata(FILE_NAME) {
        println!(
            "{}. A file will be created after choosing your settings",
            format!("File {} doesn't exist", FILE_NAME.cyan()).bold()
        );
        return Ok(None);
    }

    let found_config = fs::read_to_string(FILE_NAME)?;
    let found_config: Value = serde_json::from_str(&found_config)?;


    match found_config.get(SETTINGS_KEY) {
        Some(settings_value) => {
            let found_config = serde_json::from_value::<ProjectChoices>(settings_value.clone());

            // Check if someone else is using copy-paste json as well
            if let Err(_) = found_config {
                // Can't use the `?` operator, since this line is mandatory
                let message = format!(
                    "A key of {SETTINGS_KEY} was found in {FILE_NAME}, {}. {} {}",
                    "but it contained invalid configuration settings.",
                    "Please delete the key-value pair",
                    "if you want to import this library from this tool"
                );

                bail!(message.truecolor(200, 0, 0).italic());
            }

            Ok(Some(found_config.unwrap()))
        },

        // This just means that another person is using "copy-paste.json"
        None => {
            println!(
                "{} not found in {}. {}",
                SETTINGS_KEY.blue().bold(),
                FILE_NAME.blue().bold(),
                "A file will be created after choosing your settings."
            );

            Ok(None)
        }
    }
}

pub fn save_settings(choices: &ProjectChoices) -> anyhow::Result<()> {
    // Check if the file exists to begin with
    let fin_str = if let Err(_) = fs::metadata(FILE_NAME) {
        // Create a new file since it doesn't exist
        serde_json::to_string_pretty(&json!({
            SETTINGS_KEY: choices
        }))?
    } else {
        // Append to the file
        let file_contents = fs::read_to_string(FILE_NAME)?;
        let mut file_contents: Value = serde_json::from_str(&file_contents)?;
        file_contents[SETTINGS_KEY] = serde_json::to_value(&choices)?;
        serde_json::to_string_pretty(&file_contents)?
    };

    fs::write(FILE_NAME, fin_str)?;

    Ok(())
}
