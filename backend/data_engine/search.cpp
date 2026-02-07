#include <iostream>
#include <fstream>
#include <string>
#include <vector>

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;

    // Combine all arguments into one query string (handles spaces)
    std::string query = "";
    for (int i = 1; i < argc; ++i) {
        query += argv[i];
        if (i < argc - 1) query += " ";
    }

    std::ifstream file("knowledge.txt");
    std::string line;
    bool found = false;

    while (std::getline(file, line)) {
        // Skip empty lines or headers
        if (line.empty() || line[0] == '#') continue;

        // Check if the query exists in the line (case-insensitive-ish)
        if (line.find(query) != std::string::npos) {
            std::cout << line << std::endl;
            found = true;
            break; 
        }
    }

    if (!found) std::cout << "No specific local data found.";
    return 0;
}