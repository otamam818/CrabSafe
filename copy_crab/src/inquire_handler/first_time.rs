use crate::models::{ProjectChoices, Runtime, ProjectBuilder, FeatureSet, Modularity, ChosenFeatures, Feature};

use inquire::{ Select, Text, MultiSelect };

pub fn inquire_main() -> ProjectChoices {
    ProjectBuilder::new()
        .set_runtime( ask_runtime() )
        .set_chosen_dir( ask_chosen_dir() )
        .set_feature_set( ask_feature_from() )
        .set_modularity( ask_modularity() )
        .build()
}

fn ask_runtime() -> Runtime {
    let options: Vec<&str> = vec![
        "Deno",
        "NodeJS",
        "client-side (React, Svelte, Vue, etc)",
    ];

    let message = "What project are you bringing crabSafe into?";
    let ans = Select::new(message, options).prompt();
    use Runtime as R;
    match ans {
        Ok("Deno") => R::Deno,
        Ok("NodeJS") => R::NodeJs,
        Ok("client-side (React, Svelte, Vue, etc)") => R::ClientSide,
        _ => panic!("An invalid option was chosen!"),
    }
}

fn ask_chosen_dir() -> String {
    let options: Vec<&str> = vec![
        "Type in path to directory",
        "Browse...",
    ];

    let message = "Choose a method to select directory";
    let ans = Select::new(message, options).prompt();
    if let Ok("Type in path to directory") = ans {
        // Ask them to type the path into the directory
        let mut found_dir = Text::new("Enter path:")
            .prompt()
            .expect("Path not entered. Quitting");

        
        while let Err(_) = std::fs::metadata(&found_dir) {
            Text::new("Invalid directory. Press ENTER to type in a folder path")
                .prompt()
                .unwrap();
            found_dir = Text::new("Enter path:")
                .prompt()
                .expect("Path not entered. Quitting");
        }

        return found_dir;
    }
    
    // Otherwise open the file browser
    let mut directory_choice = rfd::FileDialog::new()
        .set_can_create_directories(true)
        .set_title("Choose a directory...")
        .pick_folder();

    while let None = directory_choice {
        Text::new("Directory not selected. Press ENTER to pick a folder")
            .prompt()
            .unwrap();

        directory_choice = rfd::FileDialog::new()
            .set_can_create_directories(true)
            .set_title("Choose a directory...")
            .pick_folder();
    }

    directory_choice
      .expect("Couldn't unwrap selected folder")
      .to_str()
      .expect("Couldn't convert pathbuf to string")
      .to_string()
}

fn ask_feature_from() -> ChosenFeatures {
    let options: Vec<&str> = vec![
        "From Preset",
        "Custom",
    ];

    let message = "How would you like to choose features?";
    let ans = Select::new(message, options).prompt();

    use ChosenFeatures as CF;
    match ans {
        Ok("From Preset") => CF::Preset { preset_name: ask_feature_preset() },
        Ok("Custom") => CF::Custom { features: ask_feature_multichoice() },
        _ => panic!("An invalid option was chosen!"),
    }
}

fn ask_feature_preset() -> FeatureSet {
    let options: Vec<&str> = vec![
        "All",
        "Core",
        "Core + Option and Result",
    ];

    let message = "Which crab-safe features do you want?";
    let ans = Select::new(message, options).prompt();

    use FeatureSet as F;
    match ans {
        Ok("All") => F::All,
        Ok("Core") => F::Core,
        Ok("Core + Option and Result") => F::CorePlus,
        _ => panic!("An invalid option was chosen!"),
    }
}

fn ask_feature_multichoice() -> Vec<Feature> {
    let options = vec![
        "Core",
        "Example",
        "Option",
        "Result",
        "Parsers",
    ];

    let ans = MultiSelect::new("Select which feature you want", options).prompt()
        .expect("Features not chosen!");

    use Feature as F;
    ans.iter()
       .map(|s| match *s {
            "Core" => F::Core,
            "Example" => F::Example,
            "Option" => F::Option,
            "Result" => F::Result,
            "Parsers" => F::Parsers,
            _ => panic!("Match statement didn't work")
       })
       .collect()
}

fn ask_modularity() -> Modularity {
    let options: Vec<&str> = vec![
        "Same file",
        "Separate files",
    ];

    let message = "Do you want the crabsafe implementations to be in separate files or in the same file?";
    let ans = Select::new(message, options).prompt();
    use Modularity as M;
    match ans {
        Ok("Same file") => M::SingleFile,
        Ok("Separate files") => M::SplitFiles,
        _ => panic!("An invalid option was chosen!"),
    }
}