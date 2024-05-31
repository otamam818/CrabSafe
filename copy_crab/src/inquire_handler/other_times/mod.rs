#![allow(unused)]
use std::{cell::RefCell, collections::HashSet, str::FromStr};
use crate::models::{ProjectChoices, Runtime, ProjectBuilder, FeatureSet, Modularity, ChosenFeatures, Feature};

use anyhow::Result;
use inquire::{ Select, Text, MultiSelect, Confirm };
use colored::Colorize;

// Treat it like a preact-signal to avoid "prop drilling"
static mut CHOICES: RefCell<Option<ProjectChoices>> = RefCell::new(None);

pub fn inquire_main(choices: ProjectChoices) -> Result<()> {
    println!(
        "Found previous configuration settings for {} project",
        format!("{:?}", &choices.runtime).bold().bright_cyan()
    );

    modify_choices(choices);

    ask_next_steps()?;
    Ok(())
}

fn modify_choices(choices: ProjectChoices) {
    let mut choices_cell = unsafe { CHOICES.borrow_mut() };
    *choices_cell = Some(choices);
}

fn ask_next_steps() -> Result<()> {
    let options: Vec<&str> = vec![
        "❄ Modify Package",
        "✖ Delete crabSafe",
    ];

    let message = "What would you like to do?";
    let ans = Select::new(message, options).prompt();
    use Runtime as R;
    match ans {
        Ok("❄ Modify Package") => handle_modify(),
        Ok("✖ Delete crabSafe") => handle_delete_crabsafe(),
        _ => panic!("An invalid option was chosen!"),
    };

    Ok(())
}

fn handle_modify() {
    let options: Vec<&str> = vec![
        "✚ Add package",
        "✖ Remove package",
        "⮜ Go Back"
    ];

    let message = "Choose aspect to modify";
    let ans = Select::new(message, options).prompt();
    use Runtime as R;
    match ans {
        Ok("✚ Add package") => handle_add(),
        Ok("✖ Remove package") => handle_delete_package(),
        Ok("⮜ Go Back") => ask_next_steps().unwrap(),
        _ => panic!("An invalid option was chosen!"),
    };
}

/// Removes the entire crabsafe, not individual modules
fn handle_delete_crabsafe() {
    let message = format!(
        "{} {}\n  {} {}",
        "WARN:".black().on_red(),
        "Doing this will remove the entire crabSafe implementation",
        "Are you sure you want to do this?",
        "Enter decision".bold()
    );
    let ans = Confirm::new(&message)
        .with_default(false)
        .with_help_message("Make sure to remove all local implementations that depend on these methods!")
        .prompt();

    if let Ok(true) = ans {
        let mut choices_signal = unsafe { CHOICES.borrow() };
        let project_choices = choices_signal
            .as_ref()
            .unwrap();

        crate::settings_finder::remove_completely(project_choices).unwrap();
    }
}

// REFACTOR: with the handle_add function
fn handle_delete_package() {
    // Turn this into a list of unadded modules
    let mut choices_signal = unsafe { CHOICES.borrow_mut() };
    let mut project_choices: &mut ProjectChoices = choices_signal
        .as_mut()
        .unwrap();

    let init_features = project_choices
        .feature_set
        .get_feature_list();

    let binding: Vec<String> = init_features
        .iter()
        .map(|feature| format!("{:?}", feature))
        .collect();

    let options: Vec<&str> = binding.iter().map(|s| s.as_str()).collect();

    let message = "What do you want to remove?";
    let ans = MultiSelect::new("Select packages", options).prompt()
        .expect("packages not chosen!");

    use Feature as F;
    let selected_features: HashSet<Feature> = ans.iter()
        .map(|s| Feature::from_str(s).expect("Chosen Features couldn't be parsed"))
        .collect();

    let features: Vec<Feature> = init_features
        .iter()
        .filter(|f| !selected_features.contains(&f))
        .cloned()
        .collect();

    if features.len() == 0 {
        // It doesn't make sense to have an packageless version of this
        // Ask them if they want to delete the whole project instead
        let message = format!(
            "{}. Do you want to delete the whole package instead?",
            "No features exist on this package.".truecolor(0, 220, 150)
        );
        let ans = Confirm::new(&message)
            .with_default(true)
            .prompt();

        if let Ok(true) = ans {
            // Remove ownership of shared value
            std::mem::drop(choices_signal);
            handle_delete_crabsafe();

            return;
        }
    }

    let message = format!(
        "{} {}\n  {} {}",
        "Warning:".black().on_yellow(),
        "Doing this will overwrite the crabSafe implementation",
        "Are you sure you want to do this?",
        "Enter decision"
    );

    let ans = Confirm::new(&message)
        .with_default(false)
        .prompt();

    if let Ok(true) = ans {
        println!("{}", "Changing data".bright_green());
        project_choices.feature_set = ChosenFeatures::Custom { features };

        if let Modularity::SplitFiles = project_choices.modularity {
            // Delete all the contents of the file
            recreate(&project_choices.chosen_directory)
                .expect("Couldn't recreate directory");
        }

        // We no longer need to update choices signal as we will be
        // passing project_choices one last time
        project_choices.handle();
    }
}

fn handle_add() {
    // Turn this into a list of unadded modules
    let mut choices_signal = unsafe { CHOICES.borrow_mut() };
    let mut project_choices: &mut ProjectChoices = choices_signal
        .as_mut()
        .unwrap();

    let init_features = project_choices
        .feature_set
        .get_feature_list();

    let binding: Vec<String> = Feature::get_complements(&init_features)
        .iter()
        .map(|feature| format!("{:?}", feature))
        .collect();

    let options: Vec<&str> = binding.iter().map(|s| s.as_str()).collect();

    let message = "Choose a package to add";
    let ans = MultiSelect::new("Select which feature you want", options).prompt()
        .expect("Features not chosen!");

    use Feature as F;
    let fin_features: Vec<Feature> = ans.iter()
        .map(|s| Feature::from_str(s).expect("Chosen Features couldn't be parsed"))
        .collect();

    let features = [init_features, fin_features].concat();

    let message = format!(
        "{} {}\n  {} {}",
        "WARN:".black().on_yellow(),
        "Doing this will overwrite the crabSafe implementation",
        "Are you sure you want to do this?",
        "Enter decision"
    );
    let ans = Confirm::new(&message)
        .with_default(false)
        .prompt();

    if let Ok(true) = ans {
        println!("{}", "Changing data".bright_green());
        project_choices.feature_set = ChosenFeatures::Custom { features };

        // We no longer need to update choices signal as we will be
        // passing project_choices one last time
        project_choices.handle();
    }
}

// Misc functions: I couldn't put it in a closure due to lack of feature support :(
fn recreate(s: &str) -> anyhow::Result<()> {
    std::fs::remove_dir_all(&s)?;
    std::fs::create_dir_all(&s)?;
    Ok(())
}

enum Pet {
    Cat {
        num_whiskers: u8,
        claws: bool,
    },
    Dog {
        bark_volume: u8,
        tail_wagging_speed: u8,
    },
}

fn approach_pet(pet: Pet) {
    match pet {
        Pet::Cat { num_whiskers, claws } => if claws {
                "Be careful".to_string()
            } else {
                format!("Approach cat with {numWhiskers} whiskers")
            },
        Pet::Dog { bark_volume, tail_wagging_speed } => {
            if tail_wagging_speed > 50 {
                "It wants you".to_string()
            } else {
                "Go earn its love".to_string()
            }
        }
    }
}