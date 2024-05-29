#![allow(unused)]
use std::{cell::RefCell, str::FromStr};
use crate::models::{ProjectChoices, Runtime, ProjectBuilder, FeatureSet, Modularity, ChosenFeatures, Feature};

use anyhow::Result;
use inquire::{ Select, Text, MultiSelect };
use colored::Colorize;

// Treat it like a preact-signal to avoid "prop drilling"
static mut CHOICES: RefCell<Option<ProjectChoices>> = RefCell::new(None);

pub fn inquire_main(choices: ProjectChoices) -> Result<()> {
    println!(
        "Found previous configuration settings for {} project",
        format!("{:?}", &choices.runtime).bright_cyan().bold()
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
        "✖ Delete package",
    ];

    let message = "What would you like to do?";
    let ans = Select::new(message, options).prompt();
    use Runtime as R;
    match ans {
        Ok("❄ Modify Package") => handle_modify(),
        Ok("✖ Delete package") => handle_delete(),
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
        Ok("✖ Remove package") => handle_delete(),
        Ok("⮜ Go Back") => ask_next_steps().unwrap(),
        _ => panic!("An invalid option was chosen!"),
    };

    todo!()
}

fn handle_delete() {
    todo!()
}

fn handle_add() {
    // Turn this into a list of unadded modules
    let mut choices_signal = unsafe { CHOICES.borrow_mut() };
    let init_features = choices_signal
        .as_ref()
        .unwrap()
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

    if let Some(mut project_choices) = choices_signal.as_mut() {
        // It's okay to clone since the data is small in size
        // And it's better to clone it before a bigger list is added to it
        let features = [init_features, fin_features].concat();
        project_choices.feature_set = ChosenFeatures::Custom { features };
        *choices_signal = Some(project_choices.clone());
    }

    todo!()
}