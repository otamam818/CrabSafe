use std::fs;

use crate::models::{ProjectChoices, Modularity};

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
                "An entry will be created after choosing your settings."
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

pub fn remove_completely(choices: &ProjectChoices) -> anyhow::Result<()> {
    // Remove the entire directory or file from existence
    use Modularity as M;
    let (data_kind, res, file_path) = match choices.modularity {
        M::SingleFile => {
            let (chosen_dir, sep) = crate::parse_path(&choices.chosen_directory);
            let file_path = format!("{chosen_dir}{sep}crabSafe.ts");
            let res = fs::remove_file(&file_path);

            ("file", res, file_path)
        },

        M::SplitFiles => {
            let (chosen_dir, sep) = crate::parse_path(&choices.chosen_directory);
            let dir_path = format!("{chosen_dir}{sep}crabSafe{sep}");
            let res = fs::remove_dir_all(&dir_path);

            ("directory", res, dir_path)
        }
    };

    match res {
        Ok(_) => println!("Deleted {data_kind} {file_path}"),
        Err(_) => println!("{file_path} renamed or already deleted")
    }

    // Remove the SETTINGS KEY from the file
    let file_contents = fs::read_to_string(FILE_NAME)?;
    let mut file_contents: Value = serde_json::from_str(&file_contents)?;

    let file_contents = file_contents
        .as_object_mut()
        .ok_or(anyhow::Error::msg("file_contents is not an object"))?;

    file_contents
        .remove(SETTINGS_KEY);

    let fin_str = serde_json::to_string_pretty(&file_contents)?;

    if file_contents.keys().len() == 0 {
        // Nobody else is using it, so it's just taking up extra space
        fs::remove_file(FILE_NAME)?;
    } else {
        // Somebody else is using it, so you can just delete your own part
        fs::write(FILE_NAME, fin_str)?;
    }

    Ok(())
}
