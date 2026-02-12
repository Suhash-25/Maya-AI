#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

// Minimalist sentiment analysis for Maya's "Vibe" check
string analyzeVibe(string prompt) {
    transform(prompt.begin(), prompt.end(), prompt.begin(), ::tolower);
    if (prompt.find("happy") != string::npos || prompt.find("great") != string::npos) return "Positive";
    if (prompt.find("sad") != string::npos || prompt.find("bad") != string::npos) return "Negative";
    return "Neutral";
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    string query = argv[1];
    string vibe = analyzeVibe(query);
    
    ifstream file("knowledge.txt");
    string line, best_match = "No local facts found.";
    
    // Simple substring search for "Absolute Truth" logic
    while (getline(file, line)) {
        if (line.find(query.substr(0, 3)) != string::npos) {
            best_match = line;
            break;
        }
    }

    // Output format for Python to parse: VIBE|FACT
    cout << vibe << "|" << best_match << endl;
    return 0;
}