mod ts_file_data;
mod models;
mod inquire_handler;
mod settings_finder;

use inquire_handler::{first_time, other_times};

fn main() {
    let config = settings_finder::find_settings().unwrap();

    match config {
        // TODO: Complete this part
        Some(found_config) => 
            other_times::inquire_main(found_config).unwrap(),

        None => {
            // Ask the user
            let project_choices = first_time::inquire_main();

            // Transform the data
            project_choices.handle().unwrap();
        }
    }

    println!("Done!")
}
